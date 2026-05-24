import type { Quote, StockQuote, TechnicalIndicators, CandleData } from './types'
import YahooFinance from 'yahoo-finance2'

const yahooFinance = new YahooFinance({
  validation: { logErrors: false, logOptionsErrors: false }
})

export async function fetchQuote(ticker: string): Promise<StockQuote | null> {
  try {
    const quote = await yahooFinance.quote(ticker.toUpperCase())
    if (!quote) return null
    return {
      ticker: quote.symbol || ticker.toUpperCase(),
      name: quote.shortName || quote.longName || ticker.toUpperCase(),
      price: quote.regularMarketPrice || 0,
      change: quote.regularMarketChange || 0,
      changePercent: quote.regularMarketChangePercent || 0,
      volume: quote.regularMarketVolume || 0,
      avgVolume: quote.averageDailyVolume10Day || quote.averageDailyVolume3Month || 0,
      high: quote.regularMarketDayHigh || 0,
      low: quote.regularMarketDayLow || 0,
      dayHigh: quote.regularMarketDayHigh || 0,
      dayLow: quote.regularMarketDayLow || 0,
      open: quote.regularMarketOpen || 0,
      previousClose: quote.regularMarketPreviousClose || 0,
      marketCap: quote.marketCap,
      pe: quote.trailingPE,
      fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh,
      fiftyTwoWeekLow: quote.fiftyTwoWeekLow,
      updatedAt: new Date()
    }
  } catch (error) {
    console.error(`Error fetching quote for ${ticker}:`, error)
    return null
  }
}

export async function fetchCandleData(
  ticker: string,
  interval: '1m' | '5m' | '15m' | '1h' | '1d' = '1d',
  period: '1d' | '5d' | '1mo' | '3mo' | '6mo' | '1y' = '3mo'
): Promise<CandleData[]> {
  try {
    const result = await yahooFinance.chart(ticker.toUpperCase(), {
      period1: getStartDate(period),
      interval,
    })
    if (!result || !result.quotes) return []
    return result.quotes
      .filter(q => q.close !== null && q.close !== undefined)
      .map(q => ({
        time: q.date instanceof Date ? q.date.toISOString() : new Date(q.date as string).toISOString(),
        open: q.open || 0,
        high: q.high || 0,
        low: q.low || 0,
        close: q.close || 0,
        volume: q.volume || 0
      }))
  } catch (error) {
    console.error(`Error fetching candle data for ${ticker}:`, error)
    return []
  }
}

function getStartDate(period: string): Date {
  const now = new Date()
  switch (period) {
    case '1d': return new Date(now.setDate(now.getDate() - 1))
    case '5d': return new Date(now.setDate(now.getDate() - 5))
    case '1mo': return new Date(now.setMonth(now.getMonth() - 1))
    case '3mo': return new Date(now.setMonth(now.getMonth() - 3))
    case '6mo': return new Date(now.setMonth(now.getMonth() - 6))
    case '1y': return new Date(now.setFullYear(now.getFullYear() - 1))
    default: return new Date(now.setMonth(now.getMonth() - 3))
  }
}

function calculateRSI(prices: number[], period: number = 14): number {
  if (prices.length < period + 1) return 50
  let gains = 0, losses = 0
  for (let i = prices.length - period; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1]
    if (change > 0) gains += change
    else losses -= change
  }
  const avgGain = gains / period
  const avgLoss = losses / period
  if (avgLoss === 0) return 100
  return 100 - (100 / (1 + avgGain / avgLoss))
}

function calculateEMA(prices: number[], period: number): number {
  if (prices.length < period) return prices[prices.length - 1] || 0
  const multiplier = 2 / (period + 1)
  let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period
  for (let i = period; i < prices.length; i++) {
    ema = (prices[i] - ema) * multiplier + ema
  }
  return ema
}

function calculateSMA(prices: number[], period: number): number {
  if (prices.length < period) return prices[prices.length - 1] || 0
  return prices.slice(-period).reduce((a, b) => a + b, 0) / period
}

function calculateMACD(prices: number[]): { macd: number; signal: number; histogram: number } {
  const ema12 = calculateEMA(prices, 12)
  const ema26 = calculateEMA(prices, 26)
  const macd = ema12 - ema26
  const macdHistory: number[] = []
  for (let i = 26; i <= prices.length; i++) {
    const slice = prices.slice(0, i)
    macdHistory.push(calculateEMA(slice, 12) - calculateEMA(slice, 26))
  }
  const signal = macdHistory.length >= 9 ? calculateEMA(macdHistory, 9) : macd
  return { macd, signal, histogram: macd - signal }
}

function calculateVWAP(candles: CandleData[]): number {
  if (candles.length === 0) return 0
  let tpv = 0, vol = 0
  for (const c of candles) {
    const tp = (c.high + c.low + c.close) / 3
    tpv += tp * c.volume
    vol += c.volume
  }
  return vol > 0 ? tpv / vol : 0
}

function calculateATR(candles: CandleData[], period: number = 14): number {
  if (candles.length < period + 1) return 0
  const trs: number[] = []
  for (let i = 1; i < candles.length; i++) {
    const c = candles[i], p = candles[i - 1]
    trs.push(Math.max(c.high - c.low, Math.abs(c.high - p.close), Math.abs(c.low - p.close)))
  }
  return calculateSMA(trs, period)
}

// ── NEW: Bollinger Bands ──────────────────────────────────────
function calculateBollingerBands(prices: number[], period: number = 20, multiplier: number = 2): {
  upper: number; middle: number; lower: number; bandwidth: number; percentB: number
} {
  if (prices.length < period) {
    const last = prices[prices.length - 1] || 0
    return { upper: last, middle: last, lower: last, bandwidth: 0, percentB: 0.5 }
  }
  const slice = prices.slice(-period)
  const middle = slice.reduce((a, b) => a + b, 0) / period
  const variance = slice.reduce((sum, p) => sum + Math.pow(p - middle, 2), 0) / period
  const stdDev = Math.sqrt(variance)
  const upper = middle + multiplier * stdDev
  const lower = middle - multiplier * stdDev
  const bandwidth = (upper - lower) / middle
  const currentPrice = prices[prices.length - 1]
  const percentB = upper !== lower ? (currentPrice - lower) / (upper - lower) : 0.5
  return { upper, middle, lower, bandwidth, percentB }
}

function detectSupportResistance(candles: CandleData[]): { support: number; resistance: number } {
  if (candles.length < 20) {
    const last = candles[candles.length - 1]
    return { support: last?.low || 0, resistance: last?.high || 0 }
  }
  const recent = candles.slice(-20)
  const lows = recent.map(c => c.low).sort((a, b) => a - b)
  const highs = recent.map(c => c.high).sort((a, b) => b - a)
  return {
    support: lows[Math.floor(lows.length * 0.1)] || lows[0],
    resistance: highs[Math.floor(highs.length * 0.1)] || highs[0]
  }
}

export async function fetchTechnicalIndicators(ticker: string): Promise<TechnicalIndicators | null> {
  try {
    const candles = await fetchCandleData(ticker, '1d', '3mo')
    if (candles.length < 20) return null

    const closes = candles.map(c => c.close)
    const currentPrice = closes[closes.length - 1]
    const prevPrice = closes[closes.length - 2] || currentPrice

    // RSI
    const rsi = calculateRSI(closes)
    const prevRsi = calculateRSI(closes.slice(0, -1))
    const rsiTrend = rsi > prevRsi + 1 ? 'rising' : rsi < prevRsi - 1 ? 'falling' : 'neutral'

    // MACD
    const { macd, signal: macdSignal, histogram: macdHistogram } = calculateMACD(closes)
    const prevMACD = calculateMACD(closes.slice(0, -1))
    const macdCrossover =
      macd > macdSignal && prevMACD.macd <= prevMACD.signal ? 'bullish' :
      macd < macdSignal && prevMACD.macd >= prevMACD.signal ? 'bearish' : 'none'

    // EMAs
    const ema9 = calculateEMA(closes, 9)
    const ema21 = calculateEMA(closes, 21)
    const ema50 = closes.length >= 50 ? calculateEMA(closes, 50) : calculateEMA(closes, closes.length)
    const ema200 = closes.length >= 200 ? calculateEMA(closes, 200) : ema50

    // SMAs
    const sma50 = closes.length >= 50 ? calculateSMA(closes, 50) : calculateSMA(closes, closes.length)
    const sma200 = closes.length >= 200 ? calculateSMA(closes, 200) : sma50

    // Golden/Death cross
    const prevEma50 = closes.length >= 51 ? calculateEMA(closes.slice(0, -1), 50) : ema50
    const prevEma200 = closes.length >= 201 ? calculateEMA(closes.slice(0, -1), 200) : ema200
    const goldenCross = ema50 > ema200 && prevEma50 <= prevEma200
    const deathCross = ema50 < ema200 && prevEma50 >= prevEma200

    // VWAP
    const vwap = calculateVWAP(candles.slice(-1).length > 0 ? candles.slice(-1) : candles.slice(-5))
    const priceVsVwap =
      currentPrice > vwap * 1.002 ? 'above' :
      currentPrice < vwap * 0.998 ? 'below' : 'at'
    const previousPriceVsVwap =
      prevPrice > vwap * 1.002 ? 'above' :
      prevPrice < vwap * 0.998 ? 'below' : 'at'

    // VWAP reclaim — price crossed from below to above VWAP
    const vwapReclaim = previousPriceVsVwap === 'below' && priceVsVwap === 'above'
    const vwapBreakdown = previousPriceVsVwap === 'above' && priceVsVwap === 'below'

    // Bollinger Bands
    const bb = calculateBollingerBands(closes)
    const bbPosition =
      currentPrice > bb.upper ? 'above_upper' :
      currentPrice < bb.lower ? 'below_lower' : 'inside'
    const prevBbPosition =
      prevPrice > bb.upper ? 'above_upper' :
      prevPrice < bb.lower ? 'below_lower' : 'inside'
    // Breakout: price just crossed above upper band
    const bbBreakout = prevBbPosition !== 'above_upper' && bbPosition === 'above_upper'
    // Bounce: price was below lower band and recovered inside
    const bbBounce = prevBbPosition === 'below_lower' && bbPosition === 'inside'

    // Volume
    const todayVolume = candles[candles.length - 1]?.volume || 0
    const avgVolume = candles.slice(-20, -1).reduce((sum, c) => sum + c.volume, 0) / 19
    const relativeVolume = avgVolume > 0 ? todayVolume / avgVolume : 1
    // High volume confirmation
    const highVolume = relativeVolume >= 1.5

    // ATR
    const atr = calculateATR(candles)

    // Support/resistance
    const { support, resistance } = detectSupportResistance(candles)
    const nearSupport = currentPrice <= support * 1.02
    const bouncing = nearSupport && currentPrice > prevPrice

    return {
      rsi, rsiTrend,
      macd, macdSignal, macdHistogram, macdCrossover,
      ema9, ema21, ema50, ema200,
      sma50, sma200,
      goldenCross, deathCross,
      vwap, priceVsVwap, previousPriceVsVwap,
      vwapReclaim, vwapBreakdown,
      bollingerUpper: bb.upper,
      bollingerMiddle: bb.middle,
      bollingerLower: bb.lower,
      bollingerBandwidth: bb.bandwidth,
      bollingerPercentB: bb.percentB,
      bbPosition, bbBreakout, bbBounce,
      relativeVolume, highVolume,
      atr,
      support, resistance,
      nearSupport, bouncing,
      price: currentPrice
    }
  } catch (error) {
    console.error(`Error calculating indicators for ${ticker}:`, error)
    return null
  }
}

export async function fetchMultipleQuotes(tickers: string[]): Promise<Map<string, StockQuote>> {
  const results = await Promise.all(tickers.map(fetchQuote))
  const quoteMap = new Map<string, StockQuote>()
  results.forEach((quote, index) => { if (quote) quoteMap.set(tickers[index].toUpperCase(), quote) })
  return quoteMap
}

export async function fetchOptionsChain(ticker: string): Promise<{
  calls: OptionContract[]; puts: OptionContract[]; expirations: string[]
} | null> {
  try {
    const result = await yahooFinance.options(ticker.toUpperCase())
    if (!result || !result.options || result.options.length === 0) return null
    const option = result.options[0]
    const mapContract = (contract: any): OptionContract => ({
      contractSymbol: contract.contractSymbol || '',
      strike: contract.strike || 0,
      expiration: contract.expiration ? new Date(contract.expiration).toISOString() : '',
      type: contract.contractSymbol?.includes('C') ? 'call' : 'put',
      lastPrice: contract.lastPrice || 0,
      bid: contract.bid || 0,
      ask: contract.ask || 0,
      volume: contract.volume || 0,
      openInterest: contract.openInterest || 0,
      impliedVolatility: contract.impliedVolatility || 0,
      inTheMoney: contract.inTheMoney || false
    })
    return {
      calls: (option.calls || []).map(mapContract),
      puts: (option.puts || []).map(mapContract),
      expirations: result.expirationDates?.map(d => new Date(d).toISOString()) || []
    }
  } catch (error) {
    console.error(`Error fetching options for ${ticker}:`, error)
    return null
  }
}

export interface OptionContract {
  contractSymbol: string; strike: number; expiration: string; type: 'call' | 'put'
  lastPrice: number; bid: number; ask: number; volume: number
  openInterest: number; impliedVolatility: number; inTheMoney: boolean
}

export async function fetchMarketSummary() {
  const [spy, qqq, dia, vix] = await Promise.all([
    fetchQuote('SPY'), fetchQuote('QQQ'), fetchQuote('DIA'), fetchQuote('^VIX')
  ])
  return { spy, qqq, dia, vix }
}

export async function searchTickers(query: string): Promise<Array<{ symbol: string; name: string; type: string }>> {
  try {
    const results = await yahooFinance.search(query, { quotesCount: 10 })
    return (results.quotes || [])
      .filter((q: any) => q.symbol && (q.quoteType === 'EQUITY' || q.quoteType === 'ETF'))
      .map((q: any) => ({ symbol: q.symbol, name: q.shortname || q.longname || q.symbol, type: q.quoteType || 'EQUITY' }))
  } catch (error) {
    console.error('Error searching tickers:', error)
    return []
  }
}