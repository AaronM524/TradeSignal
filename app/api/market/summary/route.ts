import { NextResponse } from 'next/server'
import { fetchMarketSummary } from '@/lib/market-data'

export async function GET() {
  try {
    const summary = await fetchMarketSummary()
    return NextResponse.json(summary)
  } catch (error) {
    console.error('Error fetching market summary:', error)
    return NextResponse.json(
      { error: 'Failed to fetch market summary' },
      { status: 500 }
    )
  }
}
