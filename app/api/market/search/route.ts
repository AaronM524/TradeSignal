import { NextRequest, NextResponse } from 'next/server'
import { searchTickers } from '@/lib/market-data'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('q')

  if (!query || query.length < 1) {
    return NextResponse.json([])
  }

  try {
    const results = await searchTickers(query)
    return NextResponse.json(results)
  } catch (error) {
    console.error('Error searching tickers:', error)
    return NextResponse.json(
      { error: 'Failed to search tickers' },
      { status: 500 }
    )
  }
}
