import { NextRequest, NextResponse } from 'next/server'
import { fetchTechnicalIndicators } from '@/lib/market-data'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const ticker = searchParams.get('ticker')

  if (!ticker) {
    return NextResponse.json(
      { error: 'Ticker parameter is required' },
      { status: 400 }
    )
  }

  const indicators = await fetchTechnicalIndicators(ticker.toUpperCase())

  if (!indicators) {
    return NextResponse.json(
      { error: `Could not calculate indicators for ${ticker}` },
      { status: 404 }
    )
  }

  return NextResponse.json(indicators)
}
