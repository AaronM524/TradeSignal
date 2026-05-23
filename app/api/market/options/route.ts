import { NextRequest, NextResponse } from 'next/server'
import { fetchOptionsChain } from '@/lib/market-data'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const ticker = searchParams.get('ticker')

  if (!ticker) {
    return NextResponse.json(
      { error: 'Ticker parameter is required' },
      { status: 400 }
    )
  }

  try {
    const options = await fetchOptionsChain(ticker.toUpperCase())

    if (!options) {
      return NextResponse.json(
        { error: `Could not fetch options for ${ticker}` },
        { status: 404 }
      )
    }

    return NextResponse.json(options)
  } catch (error) {
    console.error(`Error fetching options for ${ticker}:`, error)
    return NextResponse.json(
      { error: 'Failed to fetch options data' },
      { status: 500 }
    )
  }
}
