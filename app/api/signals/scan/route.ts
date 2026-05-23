import { NextRequest, NextResponse } from 'next/server'
import { fetchQuote, fetchTechnicalIndicators } from '@/lib/market-data'
import { detectSignal } from '@/lib/signals/signal-engine'
import { fetchTickerNews, calculateNewsBoost } from '@/lib/finnhub-news'
import { createClient } from '@/lib/supabase/server'

const DEFAULT_TICKERS = [
  'SPY', 'QQQ', 'AAPL', 'MSFT', 'NVDA', 'TSLA', 'AMD', 'PLTR', 'SOFI', 'SMR',
]

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

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const tickersParam = searchParams.get('tickers')
    const minScore = Number(searchParams.get('minScore') ?? '50')

    const tickers = tickersParam
      ? tickersParam.split(',').map((t) => t.trim().toUpperCase()).filter(Boolean)
      : DEFAULT_TICKERS

    const signals: SignalResult[] = []
    const failedTickers: string[] = []

    for (let i = 0; i < tickers.length; i++) {
      const ticker = tickers[i]

      try {
        // Fetch live quote
        const quote = await fetchQuote(ticker)
        if (!quote) {
          failedTickers.push(ticker)
          continue
        }

        // Get indicators from cache or fetch
        let indicators = getCachedIndicators(ticker)
        if (!indicators) {
          indicators = await fetchTechnicalIndicators(ticker)
          if (indicators) setCachedIndicators(ticker, indicators)
        }

        if (!indicators) {
          failedTickers.push(ticker)
          continue
        }

        // Get news from cache or fetch
        let news = getCachedNews(ticker)
        if (!news) {
          news = await fetchTickerNews(ticker, 3)
          setCachedNews(ticker, news)
        }

        const newsBoost = calculateNewsBoost(news)

        // Generate signal
        const signal = detectSignal({
          ticker,
          quote: quote as any,
          indicators: indicators as any,
          newsBoost, // passed to signal engine for score adjustment
        }) as SignalResult | null

        if (signal) {
          // Attach news to signal for display on card
          signal.news = news.slice(0, 2) // show top 2 headlines
          signal.newsBoost = newsBoost

          const newsLabel = newsBoost > 0 ? `📰+${newsBoost}` : newsBoost < 0 ? `📰${newsBoost}` : ''
          console.log(`[${ticker}] score:${signal.score} type:${signal.signalType} rsi:${indicators.rsi.toFixed(1)} macd:${indicators.macdCrossover} ${newsLabel}`)

          if (signal.score >= minScore) {
            signals.push(signal)
          }
        }
      } catch (error) {
        console.error(`Failed scanning ${ticker}:`, error)
        failedTickers.push(ticker)
      }

      if (i < tickers.length - 1) {
        await sleep(1500)
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