import { NextResponse } from 'next/server'

export async function GET() {
  const apikey = process.env.TWELVE_DATA_API_KEY
  
  const response = await fetch(
    `https://api.twelvedata.com/rsi?symbol=AAPL&interval=1day&time_period=14&outputsize=2&apikey=${apikey}`,
    { cache: 'no-store' }
  )
  
  const data = await response.json()
  return NextResponse.json(data)
}