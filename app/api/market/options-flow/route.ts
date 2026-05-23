import { NextResponse } from 'next/server'
import YahooFinance from 'yahoo-finance2'

// Create Yahoo Finance instance with options
const yahooFinance = new YahooFinance({
  validation: { logErrors: false, logOptionsErrors: false }
})

// Popular tickers to scan for options flow
const TICKERS_TO_SCAN = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'AMD', 'SPY', 'QQQ']

interface OptionsFlowItem {
  ticker: string
  type: 'CALL' | 'PUT'
  strike: number
  expiry: string
  premium: number
  volume: number
  openInterest: number
  iv: number
  sentiment: 'bullish' | 'bearish'
  score: number
}

export async function GET() {
  try {
    const flows: OptionsFlowItem[] = []
    
    // Fetch options data for each ticker
    const results = await Promise.allSettled(
      TICKERS_TO_SCAN.map(async (ticker) => {
        try {
          const options = await yahooFinance.options(ticker)
          
          if (!options || !options.options || options.options.length === 0) {
            return []
          }
          
          const optionData = options.options[0]
          const tickerFlows: OptionsFlowItem[] = []
          
          // Process calls
          for (const call of (optionData.calls || []).slice(0, 5)) {
            if (call.volume && call.volume > 100 && call.openInterest) {
              const volumeOI = call.volume / (call.openInterest || 1)
              const premium = (call.lastPrice || 0) * call.volume * 100
              
              // Calculate unusual score
              let score = 50
              if (volumeOI > 2) score += 20
              else if (volumeOI > 1) score += 10
              if (premium > 1000000) score += 20
              else if (premium > 500000) score += 10
              if ((call.impliedVolatility || 0) > 0.5) score += 10
              
              // Handle expiration - could be Date object, timestamp, or number
              let expiryDate = ''
              if (call.expiration) {
                if (call.expiration instanceof Date) {
                  expiryDate = call.expiration.toISOString().split('T')[0]
                } else if (typeof call.expiration === 'number' && call.expiration < 10000000000) {
                  // Unix timestamp in seconds
                  expiryDate = new Date(call.expiration * 1000).toISOString().split('T')[0]
                } else if (typeof call.expiration === 'number') {
                  // Unix timestamp in milliseconds
                  expiryDate = new Date(call.expiration).toISOString().split('T')[0]
                }
              }
              
              tickerFlows.push({
                ticker,
                type: 'CALL',
                strike: call.strike || 0,
                expiry: expiryDate,
                premium,
                volume: call.volume,
                openInterest: call.openInterest || 0,
                iv: call.impliedVolatility || 0,
                sentiment: 'bullish',
                score: Math.min(100, score)
              })
            }
          }
          
          // Process puts
          for (const put of (optionData.puts || []).slice(0, 5)) {
            if (put.volume && put.volume > 100 && put.openInterest) {
              const volumeOI = put.volume / (put.openInterest || 1)
              const premium = (put.lastPrice || 0) * put.volume * 100
              
              // Calculate unusual score
              let score = 50
              if (volumeOI > 2) score += 20
              else if (volumeOI > 1) score += 10
              if (premium > 1000000) score += 20
              else if (premium > 500000) score += 10
              if ((put.impliedVolatility || 0) > 0.5) score += 10
              
              // Handle expiration - could be Date object, timestamp, or number
              let putExpiryDate = ''
              if (put.expiration) {
                if (put.expiration instanceof Date) {
                  putExpiryDate = put.expiration.toISOString().split('T')[0]
                } else if (typeof put.expiration === 'number' && put.expiration < 10000000000) {
                  putExpiryDate = new Date(put.expiration * 1000).toISOString().split('T')[0]
                } else if (typeof put.expiration === 'number') {
                  putExpiryDate = new Date(put.expiration).toISOString().split('T')[0]
                }
              }
              
              tickerFlows.push({
                ticker,
                type: 'PUT',
                strike: put.strike || 0,
                expiry: putExpiryDate,
                premium,
                volume: put.volume,
                openInterest: put.openInterest || 0,
                iv: put.impliedVolatility || 0,
                sentiment: 'bearish',
                score: Math.min(100, score)
              })
            }
          }
          
          return tickerFlows
        } catch (err) {
          console.error(`Error fetching options for ${ticker}:`, err)
          return []
        }
      })
    )
    
    // Collect all successful results
    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        flows.push(...result.value)
      }
    }
    
    // Sort by score descending
    flows.sort((a, b) => b.score - a.score)
    
    return NextResponse.json({ flows: flows.slice(0, 50) })
  } catch (error) {
    console.error('Error fetching options flow:', error)
    return NextResponse.json({ flows: [] })
  }
}
