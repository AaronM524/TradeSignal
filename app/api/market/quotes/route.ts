import { NextRequest, NextResponse } from 'next/server'
import { fetchMultipleQuotes } from '@/lib/market-data'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const tickersParam = searchParams.get('tickers')

  if (!tickersParam) {
    return NextResponse.json(
      { error: 'Tickers parameter is required' },
      { status: 400 }
    )
  }

  const tickers = tickersParam.split(',').map(t => t.trim().toUpperCase())
  const quotesMap = await fetchMultipleQuotes(tickers)
  
  const quotes = Array.from(quotesMap.values())

  return NextResponse.json({ quotes })
}
