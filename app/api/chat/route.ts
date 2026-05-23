import {
  convertToModelMessages,
  streamText,
  tool,
  UIMessage,
  stepCountIs,
} from 'ai'
import { createGroq } from '@ai-sdk/groq'
import { z } from 'zod'

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY })

export const maxDuration = 60

function getBaseUrl() {
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return 'http://localhost:3000'
}

const tradingTools = {
  analyzeStock: tool({
    description: 'Analyze a stock ticker and provide technical analysis',
    inputSchema: z.object({
      ticker: z.string().describe('The stock ticker symbol (e.g., AAPL, TSLA)'),
    }),
    execute: async ({ ticker }) => {
      try {
        const baseUrl = getBaseUrl()
        const [quoteRes, indicatorsRes] = await Promise.all([
          fetch(`${baseUrl}/api/market/quote?ticker=${ticker}`),
          fetch(`${baseUrl}/api/market/indicators?ticker=${ticker}`)
        ])
        if (!quoteRes.ok || !indicatorsRes.ok) return { error: `Could not fetch data for ${ticker}` }
        const quote = await quoteRes.json()
        const indicators = await indicatorsRes.json()
        return {
          ticker,
          price: quote.price,
          change: quote.change,
          changePercent: quote.changePercent,
          volume: quote.volume,
          rsi: indicators.rsi,
          rsiTrend: indicators.rsiTrend,
          macd: indicators.macd,
          macdSignal: indicators.macdSignal,
          macdCrossover: indicators.macdCrossover,
          vwap: indicators.vwap,
          priceVsVwap: indicators.priceVsVwap,
          ema9: indicators.ema9,
          ema21: indicators.ema21,
          relativeVolume: indicators.relativeVolume,
        }
      } catch {
        return { error: `Failed to analyze ${ticker}` }
      }
    },
  }),

  getSignals: tool({
    description: 'Get current trade signals from the scanner',
    inputSchema: z.object({
      minScore: z.number().optional().describe('Minimum signal score (default: 50)'),
    }),
    execute: async ({ minScore = 50 }) => {
      try {
        const baseUrl = getBaseUrl()
        const res = await fetch(`${baseUrl}/api/signals/scan?minScore=${minScore}`)
        if (!res.ok) return { error: 'Could not fetch signals' }
        const data = await res.json()
        return {
          signalCount: data.signalCount,
          scannedCount: data.scannedCount,
          topSignals: data.signals.slice(0, 5).map((s: {
            ticker: string; score: number; confidence: string
            signalType: string; triggers: Array<{ type: string }>
          }) => ({
            ticker: s.ticker, score: s.score, confidence: s.confidence,
            signalType: s.signalType, triggerCount: s.triggers.length,
          })),
        }
      } catch {
        return { error: 'Failed to fetch signals' }
      }
    },
  }),

  calculatePositionSize: tool({
    description: 'Calculate position size based on risk management',
    inputSchema: z.object({
      accountSize: z.number().describe('Total account value in dollars'),
      riskPercent: z.number().describe('Risk percentage per trade (e.g., 1 for 1%)'),
      entryPrice: z.number().describe('Entry price'),
      stopLoss: z.number().describe('Stop loss price'),
    }),
    execute: async ({ accountSize, riskPercent, entryPrice, stopLoss }) => {
      const riskAmount = accountSize * (riskPercent / 100)
      const riskPerShare = Math.abs(entryPrice - stopLoss)
      const shares = Math.floor(riskAmount / riskPerShare)
      const positionValue = shares * entryPrice
      return {
        shares, positionValue, riskAmount, riskPerShare,
        percentOfAccount: ((positionValue / accountSize) * 100).toFixed(2),
      }
    },
  }),
}

const systemPrompt = `You are TradeSignal AI, a helpful trading assistant that helps users understand market setups and technical analysis.

Today's date: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}

Your capabilities:
- Analyze stocks using technical indicators (RSI, MACD, VWAP, moving averages)
- Explain trade setups in plain English
- Calculate position sizes with proper risk management
- Identify potential entry points, stop losses, and targets

Guidelines:
1. Always emphasize risk management — never encourage over-leveraging
2. Remind users that past performance doesn't guarantee future results
3. Explain the "why" behind signals — help users learn
4. Be concise but thorough in your analysis
5. When discussing setups, mention both bullish and bearish scenarios
6. Always suggest a stop loss and risk/reward ratio
7. After giving analysis, suggest 2-3 natural follow-up questions the user might want to ask, formatted as: "You might also want to ask: ..."

When analyzing stocks:
- RSI < 30 is oversold (potential bounce)
- RSI > 70 is overbought (potential pullback)
- MACD crossing above signal line is bullish
- Price above VWAP indicates strength
- Relative volume > 1.5x shows conviction

Remember: You're here to educate and inform, not provide financial advice. Always recommend users do their own research.`

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json()

  const result = streamText({
    model: groq('llama-3.3-70b-versatile'),
    system: systemPrompt,
    messages: await convertToModelMessages(messages),
    tools: tradingTools,
    stopWhen: stepCountIs(20),
  })

  return result.toUIMessageStreamResponse({
    onError: (error) => {
      console.error('Chat stream error:', error)
      return error instanceof Error ? error.message : 'Unknown error'
    },
  })
}