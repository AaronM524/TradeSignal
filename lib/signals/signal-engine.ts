import type { Quote, TechnicalIndicators, TradeSignal, SignalTrigger, SignalType, Confidence } from '../types'

interface SignalInput {
  ticker: string
  quote: Quote
  indicators: TechnicalIndicators
  optionsFlowScore?: number
  newsBoost?: number
}

function calculateStopLoss(price: number, atr: number, isBullish: boolean): number {
  return isBullish ? price - (atr * 2) : price + (atr * 2)
}

function calculateTarget(price: number, stopLoss: number, riskRewardRatio: number = 2): number {
  const risk = Math.abs(price - stopLoss)
  return price > stopLoss ? price + (risk * riskRewardRatio) : price - (risk * riskRewardRatio)
}

export function detectSignal(input: SignalInput): TradeSignal | null {
  const { ticker, quote, indicators, optionsFlowScore = 0, newsBoost = 0 } = input

  let score = 0
  const triggers: SignalTrigger[] = []
  let isBullish = true

  // ── PRICE MOMENTUM ───────────────────────────────────────────
  if (quote.changePercent > 3) {
    score += 20; isBullish = true
    triggers.push({ type: 'STRONG_MOMENTUM_UP', strength: 'strong', description: `Up ${quote.changePercent.toFixed(2)}% today — strong momentum`, value: quote.changePercent })
  } else if (quote.changePercent > 1.5) {
    score += 10
    triggers.push({ type: 'MOMENTUM_UP', strength: 'moderate', description: `Up ${quote.changePercent.toFixed(2)}% today`, value: quote.changePercent })
  } else if (quote.changePercent < -3) {
    score += 15; isBullish = false
    triggers.push({ type: 'STRONG_MOMENTUM_DOWN', strength: 'strong', description: `Down ${Math.abs(quote.changePercent).toFixed(2)}% today — bearish momentum`, value: quote.changePercent })
  } else if (quote.changePercent < -1.5) {
    score += 8; isBullish = false
    triggers.push({ type: 'MOMENTUM_DOWN', strength: 'moderate', description: `Down ${Math.abs(quote.changePercent).toFixed(2)}% today`, value: quote.changePercent })
  }

  // ── RSI ──────────────────────────────────────────────────────
  if (indicators.rsi < 30 && indicators.rsiTrend === 'rising') {
    score += 25; isBullish = true
    triggers.push({ type: 'RSI_OVERSOLD_BOUNCE', strength: 'strong', description: `RSI at ${indicators.rsi.toFixed(1)} bouncing from oversold`, value: indicators.rsi })
  } else if (indicators.rsi < 35 && indicators.rsiTrend === 'rising') {
    score += 15; isBullish = true
    triggers.push({ type: 'RSI_REVERSAL', strength: 'moderate', description: `RSI at ${indicators.rsi.toFixed(1)} turning up from low levels`, value: indicators.rsi })
  } else if (indicators.rsi > 70 && indicators.rsiTrend === 'falling') {
    score += 20; isBullish = false
    triggers.push({ type: 'RSI_OVERBOUGHT_REJECTION', strength: 'strong', description: `RSI at ${indicators.rsi.toFixed(1)} rejecting from overbought`, value: indicators.rsi })
  } else if (indicators.rsi > 65 && indicators.rsiTrend === 'falling') {
    score += 10; isBullish = false
    triggers.push({ type: 'RSI_FADING', strength: 'moderate', description: `RSI at ${indicators.rsi.toFixed(1)} fading from high levels`, value: indicators.rsi })
  }

  // ── MACD ─────────────────────────────────────────────────────
  if (indicators.macdCrossover === 'bullish') {
    score += 25; isBullish = true
    triggers.push({ type: 'MACD_BULLISH_CROSS', strength: 'strong', description: 'MACD crossed above signal line — momentum shifting bullish', value: indicators.macd })
  } else if (indicators.macdCrossover === 'bearish') {
    score += 25; isBullish = false
    triggers.push({ type: 'MACD_BEARISH_CROSS', strength: 'strong', description: 'MACD crossed below signal line — momentum shifting bearish', value: indicators.macd })
  }

  // ── EMA 9/21 ALIGNMENT ───────────────────────────────────────
  if (quote.price > indicators.ema9 && indicators.ema9 > indicators.ema21) {
    score += 15
    triggers.push({ type: 'MA_BULLISH_ALIGNMENT', strength: 'strong', description: 'Price > 9 EMA > 21 EMA — bullish trend structure', value: indicators.ema9 })
  } else if (quote.price < indicators.ema9 && indicators.ema9 < indicators.ema21) {
    score += 15; isBullish = false
    triggers.push({ type: 'MA_BEARISH_ALIGNMENT', strength: 'strong', description: 'Price < 9 EMA < 21 EMA — bearish trend structure', value: indicators.ema9 })
  }

  // ── EMA 50/200 TREND ─────────────────────────────────────────
  if (indicators.ema50 && indicators.ema200) {
    if (quote.price > indicators.ema50 && indicators.ema50 > indicators.ema200) {
      score += 12
      triggers.push({ type: 'EMA_50_200_BULLISH', strength: 'moderate', description: `Price above 50 EMA ($${indicators.ema50.toFixed(2)}) and 200 EMA ($${indicators.ema200.toFixed(2)}) — strong uptrend`, value: indicators.ema50 })
    } else if (quote.price < indicators.ema50 && indicators.ema50 < indicators.ema200) {
      score += 12; isBullish = false
      triggers.push({ type: 'EMA_50_200_BEARISH', strength: 'moderate', description: `Price below 50 EMA ($${indicators.ema50.toFixed(2)}) and 200 EMA ($${indicators.ema200.toFixed(2)}) — strong downtrend`, value: indicators.ema50 })
    }
  }

  // ── GOLDEN / DEATH CROSS ─────────────────────────────────────
  if (indicators.goldenCross) {
    score += 20; isBullish = true
    triggers.push({ type: 'GOLDEN_CROSS', strength: 'strong', description: '50 EMA just crossed above 200 EMA — powerful bullish signal', value: indicators.ema50 })
  } else if (indicators.deathCross) {
    score += 20; isBullish = false
    triggers.push({ type: 'DEATH_CROSS', strength: 'strong', description: '50 EMA just crossed below 200 EMA — powerful bearish signal', value: indicators.ema50 })
  } else if (indicators.sma50 > indicators.sma200 && quote.price > indicators.sma50) {
    score += 8
    triggers.push({ type: 'GOLDEN_CROSS_CONTEXT', strength: 'moderate', description: '50 SMA above 200 SMA — bullish long-term trend', value: indicators.sma50 })
  } else if (indicators.sma50 < indicators.sma200 && quote.price < indicators.sma50) {
    score += 8; isBullish = false
    triggers.push({ type: 'DEATH_CROSS_CONTEXT', strength: 'moderate', description: '50 SMA below 200 SMA — bearish long-term trend', value: indicators.sma50 })
  }

  // ── VWAP CONTEXT (daily data only — not intraday reclaim) ────
  if (indicators.priceVsVwap === 'above') {
    score += 5
    triggers.push({ type: 'ABOVE_VWAP', strength: 'moderate', description: `Trading above VWAP ($${indicators.vwap?.toFixed(2)}) — bullish daily bias`, value: indicators.vwap })
  } else if (indicators.priceVsVwap === 'below') {
    score += 5; isBullish = false
    triggers.push({ type: 'BELOW_VWAP', strength: 'moderate', description: `Trading below VWAP ($${indicators.vwap?.toFixed(2)}) — bearish daily bias`, value: indicators.vwap })
  }

  // ── BOLLINGER BANDS ───────────────────────────────────────────
  if (indicators.bbBreakout) {
    score += 15; isBullish = true
    triggers.push({ type: 'BB_UPPER_BREAKOUT', strength: 'strong', description: `Price broke above upper Bollinger Band ($${indicators.bollingerUpper?.toFixed(2)}) — momentum breakout`, value: indicators.bollingerUpper })
  } else if (indicators.bbBounce) {
    score += 15; isBullish = true
    triggers.push({ type: 'BB_LOWER_BOUNCE', strength: 'strong', description: `Price bounced off lower Bollinger Band ($${indicators.bollingerLower?.toFixed(2)}) — potential reversal`, value: indicators.bollingerLower })
  } else if (indicators.bbPosition === 'below_lower') {
    score += 10; isBullish = false
    triggers.push({ type: 'BB_BELOW_LOWER', strength: 'moderate', description: `Price below lower Bollinger Band — oversold extreme, watch for bounce`, value: indicators.bollingerLower })
  } else if (indicators.bbPosition === 'above_upper') {
    score += 8
    triggers.push({ type: 'BB_ABOVE_UPPER', strength: 'moderate', description: `Price above upper Bollinger Band — strong momentum but watch for pullback`, value: indicators.bollingerUpper })
  }

  // ── HIGH VOLUME CONFIRMATION ──────────────────────────────────
  if (indicators.highVolume && triggers.length > 0) {
    score += 12
    triggers.push({ type: 'HIGH_VOLUME_CONFIRMATION', strength: 'strong', description: `Volume ${indicators.relativeVolume?.toFixed(1)}x above average — conviction behind the move`, value: indicators.relativeVolume })
  }

  // ── SUPPORT BOUNCE ───────────────────────────────────────────
  if (indicators.nearSupport && indicators.bouncing) {
    score += 15; isBullish = true
    triggers.push({ type: 'SUPPORT_BOUNCE', strength: 'strong', description: `Bouncing off support at $${indicators.support?.toFixed(2)}`, value: indicators.support })
  }

  // ── NEWS BOOST ───────────────────────────────────────────────
  if (newsBoost > 0) {
    score += newsBoost
    triggers.push({ type: 'POSITIVE_NEWS_CATALYST', strength: newsBoost >= 15 ? 'strong' : 'moderate', description: `Positive news sentiment boosting signal (+${newsBoost} pts)`, value: newsBoost })
  } else if (newsBoost < 0) {
    score += newsBoost
    triggers.push({ type: 'NEGATIVE_NEWS_RISK', strength: 'weak', description: `Negative news sentiment reducing signal (${newsBoost} pts)`, value: newsBoost })
  }

  // ── OPTIONS FLOW ─────────────────────────────────────────────
  if (optionsFlowScore > 80) {
    score += 20
    triggers.push({ type: 'STRONG_OPTIONS_FLOW', strength: 'strong', description: `Unusual options activity (score: ${optionsFlowScore})`, value: optionsFlowScore })
  } else if (optionsFlowScore > 60) {
    score += 10
    triggers.push({ type: 'UNUSUAL_OPTIONS_ACTIVITY', strength: 'moderate', description: `Elevated options activity (score: ${optionsFlowScore})`, value: optionsFlowScore })
  }

  if (score < 30 || triggers.filter(t => t.type !== 'NEGATIVE_NEWS_RISK').length < 1) return null

  score = Math.min(100, Math.max(0, score))

  const signalType: SignalType = isBullish ? 'bullish_entry' : 'bearish_entry'
  const confidence: Confidence = score >= 75 ? 'high' : score >= 55 ? 'medium' : 'low'

  const entryPrice = quote.price
  const stopLoss = calculateStopLoss(entryPrice, indicators.atr, isBullish)
  const targetPrice = calculateTarget(entryPrice, stopLoss, 2)
  const riskReward = Math.abs(targetPrice - entryPrice) / Math.abs(entryPrice - stopLoss)

  return {
    id: crypto.randomUUID(),
    ticker, signalType, score, confidence, triggers,
    entry: entryPrice, entryPrice,
    stopLoss,
    target: targetPrice, targetPrice,
    riskReward,
    wasViewed: false,
    createdAt: new Date()
  }
}

export async function scanForSignals(
  tickers: string[],
  getQuoteAndIndicators: (ticker: string) => Promise<{ quote: Quote; indicators: TechnicalIndicators } | null>
): Promise<TradeSignal[]> {
  const signals: TradeSignal[] = []
  const results = await Promise.all(
    tickers.map(async (ticker) => {
      try {
        const data = await getQuoteAndIndicators(ticker)
        if (!data) return null
        return detectSignal({ ticker, quote: data.quote, indicators: data.indicators })
      } catch (error) {
        console.error(`Error scanning ${ticker}:`, error)
        return null
      }
    })
  )
  results.forEach(signal => { if (signal) signals.push(signal) })
  return signals.sort((a, b) => b.score - a.score)
}