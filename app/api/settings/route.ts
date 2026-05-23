import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  
  const { data, error } = await supabase
    .from("signal_settings")
    .select("*")
    .eq("user_id", user.id)
    .single()
  
  if (error && error.code !== "PGRST116") {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  // Return default settings if none exist
  if (!data) {
    return NextResponse.json({
      min_score: 60,
      enabled_signals: ["RSI", "MACD", "VWAP", "VOLUME", "OPTIONS_FLOW"],
      push_notifications: true,
      email_digest: false,
      scan_watchlist_only: false
    })
  }
  
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  
  const settings = await request.json()
  
  const { data, error } = await supabase
    .from("signal_settings")
    .upsert({
      user_id: user.id,
      min_score: settings.minScore,
      enabled_signals: settings.enabledSignals,
      push_notifications: settings.pushNotifications,
      email_digest: settings.emailDigest,
      scan_watchlist_only: settings.scanWatchlistOnly
    }, { onConflict: "user_id" })
    .select()
    .single()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(data)
}
