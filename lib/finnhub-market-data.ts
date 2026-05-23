const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1'

function getApiKey() {
  const key = process.env.FINNHUB_API_KEY
  if (!key) throw new Error('Missing FINNHUB_API_KEY')
  return key
}

async function finnhubFetch<T>(endpoint: string): Promise<T> {
  const token = getApiKey()
  const separator = endpoint.includes('?') ? '&' : '?'
  const response = await fetch(
    `${FINNHUB_BASE_URL}${endpoint}${separator}token=${token}`,
    { cache: 'no-store' }
  )
  if (!response.ok) {
    throw new Error(`Finnhub error: ${response.status}`)
  }
  return response.json()
}

type FinnhubQuote = {
  c: number
  d: number
  dp: number
  h: number
  l: number
  o: number
  pc: number
  t: number
}

type FinnhubMetrics = {
  metric: {
    '52WeekHigh': number
    '52WeekLow': number
    '10DayAverageTradingVolume': number
    '3MonthAverageTradingVolume': number
    rsi14: number | null
  }
}

export async function fetchFinnhubQuote(ticker: string) {
  try {
    const quote = await finnhubFetch<FinnhubQuote>(
      `/quote?symbol=${ticker.toUpperCase()}`
    )
    if (!quote || !quote.c) return null

    return {
      ticker: ticker.toUpperCase(),
      price: quote.c,
      change: quote.d ?? 0,
      changePercent: quote.dp ?? 0,
      high: quote.h ?? quote.c,
      low: quote.l ?? quote.c,
      open: quote.o ?? quote.c,
      previousClose: quote.pc ?? quote.c,
      volume: 0,
      time: quote.t,
    }
  } catch (error) {
    console.error(`Error fetching Finnhub quote for ${ticker}:`, error)
    return null
  }
}

// Only makes 1 API call (metrics) — quote is fetched separately in the route
// Builds synthetic candles so the signal engine gets the shape it expects
export async function fetchFinnhubCandleData(ticker: string, quote?: { c: number; h: number; l: number; o: number; pc: number }) {
  try {
    const metrics = await finnhubFetch<FinnhubMetrics>(
      `/stock/metric?symbol=${ticker.toUpperCase()}&metric=all`
    )

    // Use passed quote values or fall back to metric-derived estimates
    const price = quote?.c ?? metrics?.metric?.['52WeekHigh']
      ? ((metrics.metric['52WeekHigh'] + metrics.metric['52WeekLow']) / 2)
      : 100

    const high = quote?.h ?? price * 1.01
    const low = quote?.l ?? price * 0.99
    const open = quote?.o ?? price
    const prevClose = quote?.pc ?? price * 0.998
    const avgVol = metrics?.metric?.['10DayAverageTradingVolume'] ?? 1

    const now = Math.floor(Date.now() / 1000)
    const DAY = 86400

    return [
      { time: now - DAY * 4, date: new Date((now - DAY * 4) * 1000).toISOString(), open: prevClose * 0.99, high: prevClose * 1.01, low: prevClose * 0.98, close: prevClose * 0.995, volume: avgVol * 0.9 },
      { time: now - DAY * 3, date: new Date((now - DAY * 3) * 1000).toISOString(), open: prevClose * 0.995, high: prevClose * 1.015, low: prevClose * 0.985, close: prevClose * 1.005, volume: avgVol },
      { time: now - DAY * 2, date: new Date((now - DAY * 2) * 1000).toISOString(), open: prevClose * 1.0, high: prevClose * 1.02, low: prevClose * 0.99, close: prevClose, volume: avgVol * 1.05 },
      { time: now - DAY, date: new Date((now - DAY) * 1000).toISOString(), open: prevClose, high: Math.max(high, prevClose * 1.01), low: Math.min(low, prevClose * 0.99), close: prevClose, volume: avgVol * 1.1 },
      { time: now, date: new Date(now * 1000).toISOString(), open, high, low, close: price, volume: avgVol * 1.2 },
    ]
  } catch (error) {
    console.error(`Error fetching Finnhub data for ${ticker}:`, error)
    return []
  }
}