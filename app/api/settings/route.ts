import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

const VALID_SIGNAL_TYPES = ['RSI', 'MACD', 'VWAP', 'VOLUME', 'OPTIONS_FLOW', 'MA_CROSS']

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

  let settings: any
  try {
    settings = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  // Basic validation — without this, a malformed request (or a future bug in the
  // client) can write undefined/out-of-range values straight into the database.
  const minScore = Number(settings.minScore)
  if (!Number.isFinite(minScore) || minScore < 0 || minScore > 100) {
    return NextResponse.json({ error: "minScore must be a number between 0 and 100" }, { status: 400 })
  }

  const enabledSignals = settings.enabledSignals
  if (!Array.isArray(enabledSignals) || !enabledSignals.every((s) => VALID_SIGNAL_TYPES.includes(s))) {
    return NextResponse.json(
      { error: `enabledSignals must be an array containing only: ${VALID_SIGNAL_TYPES.join(', ')}` },
      { status: 400 }
    )
  }

  if (
    typeof settings.pushNotifications !== 'boolean' ||
    typeof settings.emailDigest !== 'boolean' ||
    typeof settings.scanWatchlistOnly !== 'boolean'
  ) {
    return NextResponse.json(
      { error: "pushNotifications, emailDigest, and scanWatchlistOnly must all be booleans" },
      { status: 400 }
    )
  }

  const { data, error } = await supabase
    .from("signal_settings")
    .upsert({
      user_id: user.id,
      min_score: minScore,
      enabled_signals: enabledSignals,
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