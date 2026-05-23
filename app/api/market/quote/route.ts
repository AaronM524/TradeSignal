import { NextRequest, NextResponse } from 'next/server'
import { fetchQuote } from '@/lib/market-data'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const ticker = searchParams.get('ticker')

  if (!ticker) {
    return NextResponse.json(
      { error: 'Ticker parameter is required' },
      { status: 400 }
    )
  }

  const quote = await fetchQuote(ticker.toUpperCase())

  if (!quote) {
    return NextResponse.json(
      { error: `Could not fetch quote for ${ticker}` },
      { status: 404 }
    )
  }

  return NextResponse.json(quote)
}
