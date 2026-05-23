// Market Data Types
export interface Quote {
  ticker: string
  price: number
  change: number
  changePercent: number
  volume: number
  avgVolume: number
  high: number
  low: number
  open: number
  previousClose: number
  marketCap?: number
  pe?: number
  updatedAt: Date
}

// Extended quote with additional fields for stock detail view
export interface StockQuote extends Quote {
  name?: string
  dayHigh?: number
  dayLow?: number
  fiftyTwoWeekHigh?: number
  fiftyTwoWeekLow?: number
}

export interface TechnicalIndicators {
  rsi: number
  rsiTrend: 'rising' | 'falling' | 'neutral'
  macd: number
  macdSignal: number
  macdHistogram: number
  macdCrossover: 'bullish' | 'bearish' | 'none'
  ema9: number
  ema21: number
  sma50: number
  sma200: number
  vwap: number
  priceVsVwap: 'above' | 'below' | 'at'
  previousPriceVsVwap?: 'above' | 'below' | 'at'
  relativeVolume: number
  atr: number
  support?: number
  resistance?: number
  nearSupport?: boolean
  bouncing?: boolean
  price?: number
}

export interface OptionsFlow {
  id: string
  ticker: string
  callPut: 'CALL' | 'PUT'
  strike: number
  expiry: string
  premium: number
  volume: number
  openInterest: number
  impliedVolatility: number
  side: 'BID' | 'ASK' | 'MID'
  sentiment: 'bullish' | 'bearish' | 'neutral'
  unusualScore: number
  timestamp: Date
}

// Signal Types
export type SignalType = 'bullish_entry' | 'bearish_entry' | 'exit_warning'
export type Confidence = 'low' | 'medium' | 'high'

export interface SignalTrigger {
  type: string
  strength: 'weak' | 'moderate' | 'strong'
  description: string
  value?: number
}

export interface TradeSignal {
  id: string
  userId?: string
  ticker: string
  signalType: SignalType
  score: number
  confidence: Confidence
  triggers: SignalTrigger[]
  entry: number
  entryPrice?: number // alias for entry
  stopLoss: number
  target: number
  targetPrice?: number // alias for target
  riskReward: number
  wasViewed: boolean
  wasActedOn?: boolean
  outcome?: 'win' | 'loss' | 'scratch'
  createdAt: Date
}

// Watchlist Types
export interface WatchlistItem {
  id: string
  userId: string
  ticker: string
  addedAt: Date
  notes?: string
  quote?: Quote
  indicators?: TechnicalIndicators
}

// Signal Settings Types
export interface SignalSettings {
  id: string
  userId: string
  minScore: number
  enabledSignals: string[]
  pushNotifications: boolean
  emailDigest: boolean
  scanWatchlistOnly: boolean
}

// Chart Data Types
export interface CandleData {
  time: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface ChartIndicator {
  name: string
  data: { time: string; value: number }[]
  color: string
}

// Database Types (matching Supabase schema)
export interface DbWatchlist {
  id: string
  user_id: string
  ticker: string
  added_at: string
  notes: string | null
}

export interface DbTradeSignal {
  id: string
  user_id: string | null
  ticker: string
  signal_type: string
  score: number
  confidence: string
  triggers: SignalTrigger[]
  entry_price: number | null
  stop_loss: number | null
  target_price: number | null
  risk_reward: number | null
  was_viewed: boolean
  was_acted_on: boolean | null
  outcome: string | null
  created_at: string
}

export interface DbSignalSettings {
  id: string
  user_id: string
  min_score: number
  enabled_signals: string[]
  push_notifications: boolean
  email_digest: boolean
  scan_watchlist_only: boolean
  created_at: string
}

export interface DbCachedQuote {
  ticker: string
  data: Quote
  updated_at: string
}
