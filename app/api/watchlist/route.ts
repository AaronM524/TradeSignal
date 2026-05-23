import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  
  const { data, error } = await supabase
    .from("watchlists")
    .select("*")
    .eq("user_id", user.id)
    .order("added_at", { ascending: false })
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  
  const { ticker, notes } = await request.json()
  
  if (!ticker) {
    return NextResponse.json({ error: "Ticker is required" }, { status: 400 })
  }
  
  const { data, error } = await supabase
    .from("watchlists")
    .insert({
      user_id: user.id,
      ticker: ticker.toUpperCase(),
      notes: notes || null
    })
    .select()
    .single()
  
  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Ticker already in watchlist" }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(data)
}

export async function DELETE(request: Request) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  
  const { searchParams } = new URL(request.url)
  const ticker = searchParams.get("ticker")
  
  if (!ticker) {
    return NextResponse.json({ error: "Ticker is required" }, { status: 400 })
  }
  
  const { error } = await supabase
    .from("watchlists")
    .delete()
    .eq("user_id", user.id)
    .eq("ticker", ticker.toUpperCase())
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json({ success: true })
}
