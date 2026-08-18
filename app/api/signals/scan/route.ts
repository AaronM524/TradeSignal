import { NextRequest, NextResponse } from 'next/server'
import { fetchQuote, fetchTechnicalIndicators } from '@/lib/market-data'
import { detectSignal } from '@/lib/signals/signal-engine'
import { fetchTickerNews, calculateNewsBoost } from '@/lib/finnhub-news'
import { createClient } from '@/lib/supabase/server'

// If deployed on Vercel, this raises the allowed execution time for this route
// (requires a plan that supports it — Hobby is capped around 10s regardless).
// Harmless no-op on other platforms.
export const maxDuration = 30

const DEFAULT_TICKERS = [
  'SPY', 'QQQ', 'AAPL', 'MSFT', 'NVDA', 'TSLA', 'AMD', 'PLTR', 'SOFI', 'SMR',
]

// How many tickers to process at the same time. Higher = faster scans, but more
// simultaneous load on Yahoo Finance / Finnhub — if you start seeing 429 rate-limit
// errors in the logs, lower this back down rather than removing it entirely.
const SCAN_CONCURRENCY = 4

// Max time to wait on any single external call before giving up on that ticker.
// Without this, one slow/hanging API call could stall the entire scan indefinitely.
const CALL_TIMEOUT_MS = 8000

type SignalResult = {
  ticker: string
  signalType?: string
  score: number
  confidence?: string
  triggers?: string[]
  entryPrice?: number
  stopLoss?: number
  targetPrice?: number
  riskReward?: number
  news?: Array<{
    headline: string
    source: string
    url: string
    sentiment: string
    datetime: number
  }>
  newsBoost?: number
}

// 15-minute indicator cache
const indicatorCache = new Map<string, { data: any; timestamp: number }>()
const CACHE_TTL = 15 * 60 * 1000

function getCachedIndicators(ticker: string) {
  const cached = indicatorCache.get(ticker)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) return cached.data
  return null
}

function setCachedIndicators(ticker: string, data: any) {
  indicatorCache.set(ticker, { data, timestamp: Date.now() })
}

// 30-minute news cache
const newsCache = new Map<string, { data: any; timestamp: number }>()
const NEWS_CACHE_TTL = 30 * 60 * 1000

function getCachedNews(ticker: string) {
  const cached = newsCache.get(ticker)
  if (cached && Date.now() - cached.timestamp < NEWS_CACHE_TTL) return cached.data
  return null
}

function setCachedNews(ticker: string, data: any) {
  newsCache.set(ticker, { data, timestamp: Date.now() })
}

// Races a promise against a timer so a single slow/hanging external call
// can never block the rest of the scan — it just gets marked failed instead.
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    promise.then(
      (res) => { clearTimeout(timer); resolve(res) },
      (err) => { clearTimeout(timer); reject(err) }
    )
  })
}

type TickerScanResult = { ticker: string; signal: SignalResult | null; failed: boolean }

async function scanTicker(ticker: string, minScore: number): Promise<TickerScanResult> {
  try {
    const quote = await withTimeout(fetchQuote(ticker), CALL_TIMEOUT_MS, `${ticker} quote`)
    if (!quote) return { ticker, signal: null, failed: true }

    let indicators = getCachedIndicators(ticker)
    if (!indicators) {
      indicators = await withTimeout(fetchTechnicalIndicators(ticker), CALL_TIMEOUT_MS, `${ticker} indicators`)
      if (indicators) setCachedIndicators(ticker, indicators)
    }
    if (!indicators) return { ticker, signal: null, failed: true }

    let news = getCachedNews(ticker)
    if (!news) {
      news = await withTimeout(fetchTickerNews(ticker, 3), CALL_TIMEOUT_MS, `${ticker} news`)
      setCachedNews(ticker, news)
    }

    const newsBoost = calculateNewsBoost(news)

    const signal = detectSignal({
      ticker,
      quote: quote as any,
      indicators: indicators as any,
      newsBoost,
    }) as SignalResult | null

    if (signal) {
      signal.news = news.slice(0, 2)
      signal.newsBoost = newsBoost

      const newsLabel = newsBoost > 0 ? `📰+${newsBoost}` : newsBoost < 0 ? `📰${newsBoost}` : ''
      console.log(`[${ticker}] score:${signal.score} type:${signal.signalType} rsi:${indicators.rsi.toFixed(1)} macd:${indicators.macdCrossover} ${newsLabel}`)
    }

    return { ticker, signal, failed: false }
  } catch (error) {
    console.error(`Failed scanning ${ticker}:`, error)
    return { ticker, signal: null, failed: true }
  }
}

// Processes tickers in fixed-size concurrent batches instead of one at a time.
// E.g. 10 tickers at concurrency 4 → 3 batches, each limited by its slowest
// ticker, instead of 10 tickers run fully back-to-back with a sleep between each.
async function scanAllTickers(tickers: string[], minScore: number): Promise<TickerScanResult[]> {
  const results: TickerScanResult[] = []
  for (let i = 0; i < tickers.length; i += SCAN_CONCURRENCY) {
    const batch = tickers.slice(i, i + SCAN_CONCURRENCY)
    const batchResults = await Promise.all(batch.map((ticker) => scanTicker(ticker, minScore)))
    results.push(...batchResults)
  }
  return results
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const tickersParam = searchParams.get('tickers')
    const minScore = Number(searchParams.get('minScore') ?? '50')

    const tickers = tickersParam
      ? tickersParam.split(',').map((t) => t.trim().toUpperCase()).filter(Boolean)
      : DEFAULT_TICKERS

    const results = await scanAllTickers(tickers, minScore)

    const signals: SignalResult[] = []
    const failedTickers: string[] = []

    for (const result of results) {
      if (result.failed) {
        failedTickers.push(result.ticker)
      } else if (result.signal && result.signal.score >= minScore) {
        signals.push(result.signal)
      }
    }

    signals.sort((a, b) => b.score - a.score)

    return NextResponse.json({
      signals,
      scannedCount: tickers.length,
      signalCount: signals.length,
      failedCount: failedTickers.length,
      failedTickers,
      provider: 'yahoo-finance+finnhub-news',
    })
  } catch (error) {
    console.error('Error in GET /api/signals/scan:', error)
    return NextResponse.json(
      { error: 'Failed to scan signals', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const signals = body.signals as SignalResult[] | undefined

    if (!signals || !Array.isArray(signals)) {
      return NextResponse.json({ error: 'Invalid signals data' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('trade_signals')
      .insert(
        signals.map((signal) => ({
          user_id: user.id,
          ticker: signal.ticker,
          signal_type: signal.signalType ?? 'UNKNOWN',
          score: signal.score,
          confidence: signal.confidence ?? null,
          triggers: signal.triggers ?? [],
          entry_price: signal.entryPrice ?? null,
          stop_loss: signal.stopLoss ?? null,
          target_price: signal.targetPrice ?? null,
          risk_reward: signal.riskReward ?? null,
        }))
      )
      .select()

    if (error) {
      console.error('Error saving signals:', error)
      return NextResponse.json({ error: 'Failed to save signals' }, { status: 500 })
    }

    return NextResponse.json({ saved: data?.length ?? 0 })
  } catch (error) {
    console.error('Error in POST /api/signals/scan:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}