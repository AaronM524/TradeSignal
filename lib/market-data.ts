import type { Quote, StockQuote, TechnicalIndicators, CandleData } from './types'
import YahooFinance from 'yahoo-finance2'

// Create Yahoo Finance instance with options
const yahooFinance = new YahooFinance({
  validation: {
    logErrors: false,
    logOptionsErrors: false,
  }
})

// Fetch real-time quote from Yahoo Finance
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

// Fetch historical candle data
export async function fetchCandleData(
  ticker: string,
  interval: '1m' | '5m' | '15m' | '1h' | '1d' = '1d',
  period: '1d' | '5d' | '1mo' | '3mo' | '6mo' | '1y' = '3mo'
): Promise<CandleData[]> {
  try {
    const result = await yahooFinance.chart(ticker.toUpperCase(), {
      period1: getStartDate(period),
      interval: interval,
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

// Helper to get start date for historical data
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

// Calculate RSI
function calculateRSI(prices: number[], period: number = 14): number {
  if (prices.length < period + 1) return 50
  
  let gains = 0
  let losses = 0
  
  for (let i = prices.length - period; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1]
    if (change > 0) gains += change
    else losses -= change
  }
  
  const avgGain = gains / period
  const avgLoss = losses / period
  
  if (avgLoss === 0) return 100
  const rs = avgGain / avgLoss
  return 100 - (100 / (1 + rs))
}

// Calculate EMA
function calculateEMA(prices: number[], period: number): number {
  if (prices.length < period) return prices[prices.length - 1] || 0
  
  const multiplier = 2 / (period + 1)
  let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period
  
  for (let i = period; i < prices.length; i++) {
    ema = (prices[i] - ema) * multiplier + ema
  }
  
  return ema
}

// Calculate SMA
function calculateSMA(prices: number[], period: number): number {
  if (prices.length < period) return prices[prices.length - 1] || 0
  const slice = prices.slice(-period)
  return slice.reduce((a, b) => a + b, 0) / period
}

// Calculate MACD
function calculateMACD(prices: number[]): { macd: number; signal: number; histogram: number } {
  const ema12 = calculateEMA(prices, 12)
  const ema26 = calculateEMA(prices, 26)
  const macd = ema12 - ema26
  
  // Calculate signal line (9-period EMA of MACD)
  // For proper calculation, we'd need historical MACD values
  // Using approximation for now
  const macdHistory: number[] = []
  for (let i = 26; i <= prices.length; i++) {
    const slice = prices.slice(0, i)
    const e12 = calculateEMA(slice, 12)
    const e26 = calculateEMA(slice, 26)
    macdHistory.push(e12 - e26)
  }
  
  const signal = macdHistory.length >= 9 ? calculateEMA(macdHistory, 9) : macd
  const histogram = macd - signal
  
  return { macd, signal, histogram }
}

// Calculate VWAP
function calculateVWAP(candles: CandleData[]): number {
  if (candles.length === 0) return 0
  
  let cumulativeTPV = 0
  let cumulativeVolume = 0
  
  for (const candle of candles) {
    const typicalPrice = (candle.high + candle.low + candle.close) / 3
    cumulativeTPV += typicalPrice * candle.volume
    cumulativeVolume += candle.volume
  }
  
  return cumulativeVolume > 0 ? cumulativeTPV / cumulativeVolume : 0
}

// Calculate ATR
function calculateATR(candles: CandleData[], period: number = 14): number {
  if (candles.length < period + 1) return 0
  
  const trueRanges: number[] = []
  
  for (let i = 1; i < candles.length; i++) {
    const current = candles[i]
    const previous = candles[i - 1]
    const tr = Math.max(
      current.high - current.low,
      Math.abs(current.high - previous.close),
      Math.abs(current.low - previous.close)
    )
    trueRanges.push(tr)
  }
  
  return calculateSMA(trueRanges, period)
}

// Detect support and resistance levels
function detectSupportResistance(candles: CandleData[]): { support: number; resistance: number } {
  if (candles.length < 20) {
    const lastCandle = candles[candles.length - 1]
    return { support: lastCandle?.low || 0, resistance: lastCandle?.high || 0 }
  }
  
  const recentCandles = candles.slice(-20)
  const lows = recentCandles.map(c => c.low).sort((a, b) => a - b)
  const highs = recentCandles.map(c => c.high).sort((a, b) => b - a)
  
  // Simple support/resistance as recent lows/highs
  return {
    support: lows[Math.floor(lows.length * 0.1)] || lows[0],
    resistance: highs[Math.floor(highs.length * 0.1)] || highs[0]
  }
}

// Fetch technical indicators with real data
export async function fetchTechnicalIndicators(ticker: string): Promise<TechnicalIndicators | null> {
  try {
    const candles = await fetchCandleData(ticker, '1d', '3mo')
    
    // Reduced requirement - need at least 20 candles for basic indicators
    if (candles.length < 20) {
      // Don't log as error, just skip silently
      return null
    }
    
    const closePrices = candles.map(c => c.close)
    const currentPrice = closePrices[closePrices.length - 1]
    
    // Calculate RSI
    const rsi = calculateRSI(closePrices)
    const prevRsi = calculateRSI(closePrices.slice(0, -1))
    const rsiTrend = rsi > prevRsi + 1 ? 'rising' : rsi < prevRsi - 1 ? 'falling' : 'neutral'
    
    // Calculate MACD
    const { macd, signal: macdSignal, histogram: macdHistogram } = calculateMACD(closePrices)
    const prevMACD = calculateMACD(closePrices.slice(0, -1))
    const macdCrossover = 
      macd > macdSignal && prevMACD.macd <= prevMACD.signal ? 'bullish' :
      macd < macdSignal && prevMACD.macd >= prevMACD.signal ? 'bearish' : 'none'
    
    // Calculate EMAs and SMAs
    const ema9 = calculateEMA(closePrices, 9)
    const ema21 = calculateEMA(closePrices, 21)
    const sma50 = closePrices.length >= 50 ? calculateSMA(closePrices, 50) : calculateSMA(closePrices, closePrices.length)
    const sma200 = closePrices.length >= 200 ? calculateSMA(closePrices, 200) : sma50
    
    // Calculate VWAP (using today's candles if available, otherwise recent)
    const todayCandles = candles.slice(-1)
    const vwap = calculateVWAP(todayCandles.length > 0 ? todayCandles : candles.slice(-5))
    const priceVsVwap = 
      currentPrice > vwap * 1.002 ? 'above' :
      currentPrice < vwap * 0.998 ? 'below' : 'at'
    
    // Previous price vs VWAP (for crossover detection)
    const prevPrice = closePrices[closePrices.length - 2] || currentPrice
    const previousPriceVsVwap = 
      prevPrice > vwap * 1.002 ? 'above' :
      prevPrice < vwap * 0.998 ? 'below' : 'at'
    
    // Calculate relative volume
    const todayVolume = candles[candles.length - 1]?.volume || 0
    const avgVolume = candles.slice(-20, -1).reduce((sum, c) => sum + c.volume, 0) / 19
    const relativeVolume = avgVolume > 0 ? todayVolume / avgVolume : 1
    
    // Calculate ATR
    const atr = calculateATR(candles)
    
    // Detect support/resistance
    const { support, resistance } = detectSupportResistance(candles)
    
    // Check for bouncing off support
    const nearSupport = currentPrice <= support * 1.02
    const bouncing = nearSupport && currentPrice > prevPrice
    
    return {
      rsi,
      rsiTrend,
      macd,
      macdSignal,
      macdHistogram,
      macdCrossover,
      ema9,
      ema21,
      sma50,
      sma200,
      vwap,
      priceVsVwap,
      previousPriceVsVwap,
      relativeVolume,
      atr,
      support,
      resistance,
      nearSupport,
      bouncing,
      price: currentPrice
    }
  } catch (error) {
    console.error(`Error calculating indicators for ${ticker}:`, error)
    return null
  }
}

// Fetch multiple quotes in parallel
export async function fetchMultipleQuotes(tickers: string[]): Promise<Map<string, StockQuote>> {
  const results = await Promise.all(tickers.map(fetchQuote))
  const quoteMap = new Map<string, StockQuote>()
  
  results.forEach((quote, index) => {
    if (quote) {
      quoteMap.set(tickers[index].toUpperCase(), quote)
    }
  })
  
  return quoteMap
}

// Fetch options chain data
export async function fetchOptionsChain(ticker: string): Promise<{
  calls: OptionContract[]
  puts: OptionContract[]
  expirations: string[]
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

// Option contract interface
export interface OptionContract {
  contractSymbol: string
  strike: number
  expiration: string
  type: 'call' | 'put'
  lastPrice: number
  bid: number
  ask: number
  volume: number
  openInterest: number
  impliedVolatility: number
  inTheMoney: boolean
}

// Fetch market summary (indices)
export async function fetchMarketSummary(): Promise<{
  spy: StockQuote | null
  qqq: StockQuote | null
  dia: StockQuote | null
  vix: StockQuote | null
}> {
  const [spy, qqq, dia, vix] = await Promise.all([
    fetchQuote('SPY'),
    fetchQuote('QQQ'),
    fetchQuote('DIA'),
    fetchQuote('^VIX')
  ])
  
  return { spy, qqq, dia, vix }
}

// Search for tickers
export async function searchTickers(query: string): Promise<Array<{
  symbol: string
  name: string
  type: string
}>> {
  try {
    const results = await yahooFinance.search(query, { quotesCount: 10 })
    
    return (results.quotes || [])
      .filter((q: any) => q.symbol && (q.quoteType === 'EQUITY' || q.quoteType === 'ETF'))
      .map((q: any) => ({
        symbol: q.symbol,
        name: q.shortname || q.longname || q.symbol,
        type: q.quoteType || 'EQUITY'
      }))
  } catch (error) {
    console.error('Error searching tickers:', error)
    return []
  }
}
