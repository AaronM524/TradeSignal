'use client'

import { useState, useEffect } from 'react'
import { Spinner } from '@/components/ui/spinner'
import { Slider } from '@/components/ui/slider'
import { Save, CheckCircle, Bell, Sliders } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { DbSignalSettings } from '@/lib/types'

const SIGNAL_TYPES = [
  { id: 'RSI', label: 'RSI Reversals', description: 'Oversold bounces and overbought rejections' },
  { id: 'MACD', label: 'MACD Crossovers', description: 'Bullish and bearish momentum shifts' },
  { id: 'VWAP', label: 'VWAP Reclaims', description: 'Price reclaiming volume weighted average' },
  { id: 'VOLUME', label: 'Volume Spikes', description: 'Unusual volume activity' },
  { id: 'OPTIONS_FLOW', label: 'Options Flow', description: 'Unusual options activity correlation' },
  { id: 'MA_CROSS', label: 'Moving Average Cross', description: '9/21 EMA and 50/200 SMA crosses' },
]

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Mono:wght@300;400;500&family=DM+Sans:wght@300;400;500;600&display=swap');
  .st-box { border: 1px solid rgba(232,224,212,0.08); }
  .st-box-header { padding: 16px 20px; border-bottom: 1px solid rgba(232,224,212,0.07); display: flex; align-items: center; gap: 10px; }
  .st-box-body { padding: 20px; }
  .st-label { font-family: "DM Mono", monospace; font-size: 9px; letter-spacing: 0.1em; text-transform: uppercase; color: rgba(232,224,212,0.45); margin-bottom: 6px; display: block; }
  .st-desc { font-family: "DM Sans", sans-serif; font-size: 12px; color: rgba(232,224,212,0.4); font-weight: 300; margin-top: 3px; }
  .st-row { display: flex; align-items: center; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid rgba(232,224,212,0.05); }
  .st-row:last-child { border-bottom: none; }
  .st-signal-row { display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; border: 1px solid rgba(232,224,212,0.07); margin-bottom: 5px; transition: border-color 0.15s; }
  .st-signal-row:hover { border-color: rgba(232,224,212,0.15); }
  .st-signal-row.on { border-color: rgba(232,224,212,0.18); background: rgba(232,224,212,0.02); }
  .st-switch { width: 36px; height: 20px; border-radius: 10px; border: 1px solid rgba(232,224,212,0.2); background: rgba(232,224,212,0.05); cursor: pointer; position: relative; transition: all 0.2s; flex-shrink: 0; }
  .st-switch.on { background: rgba(232,224,212,0.2); border-color: rgba(232,224,212,0.4); }
  .st-knob { width: 14px; height: 14px; border-radius: 50%; background: #e8e0d4; position: absolute; top: 2px; left: 2px; transition: transform 0.2s; }
  .st-switch.on .st-knob { transform: translateX(16px); }
  .btn-save { display: flex; align-items: center; gap: 8px; padding: 12px 28px; background: #e8e0d4; color: #0a0a0a; border: none; font-family: "DM Sans", sans-serif; font-size: 13px; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; cursor: pointer; transition: opacity 0.15s; width: 100%; justify-content: center; }
  .btn-save:hover { opacity: 0.85; }
  .btn-save:disabled { opacity: 0.4; cursor: not-allowed; }
  @media (max-width: 768px) {
    .st-grid { grid-template-columns: 1fr !important; }
    .st-page { padding: 16px !important; }
    .st-box-header { flex-wrap: wrap; }
  }
`

export default function SettingsPage() {
  const [settings, setSettings] = useState<Partial<DbSignalSettings>>({
    min_score: 60,
    enabled_signals: ['RSI', 'MACD', 'VWAP', 'VOLUME', 'OPTIONS_FLOW'],
    push_notifications: true,
    email_digest: false,
    scan_watchlist_only: false,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const supabase = createClient()

  useEffect(() => { loadSettings() }, [])

  const loadSettings = async () => {
    setIsLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data, error } = await supabase.from('signal_settings').select('*').eq('user_id', user.id).single()
      if (data && !error) setSettings(data)
    } catch (e) { console.error(e) }
    finally { setIsLoading(false) }
  }

  const saveSettings = async () => {
    setIsSaving(true); setSaved(false)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { error } = await supabase.from('signal_settings').upsert({
        user_id: user.id,
        min_score: settings.min_score,
        enabled_signals: settings.enabled_signals,
        push_notifications: settings.push_notifications,
        email_digest: settings.email_digest,
        scan_watchlist_only: settings.scan_watchlist_only,
      })
      if (!error) { setSaved(true); setTimeout(() => setSaved(false), 3000) }
    } catch (e) { console.error(e) }
    finally { setIsSaving(false) }
  }

  const toggleSignal = (id: string) => {
    const cur = settings.enabled_signals || []
    setSettings({ ...settings, enabled_signals: cur.includes(id) ? cur.filter(s => s !== id) : [...cur, id] })
  }

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '64px', background: '#0a0a0a', minHeight: '100vh' }}>
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  return (
    <div className="st-page" style={{ padding: '32px 40px', fontFamily: '"DM Sans", sans-serif', color: '#e8e0d4', minHeight: '100vh', background: '#0a0a0a' }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(232,224,212,0.4)', marginBottom: '8px' }}>Preferences</div>
        <h1 style={{ fontFamily: '"Playfair Display", serif', fontSize: '32px', fontWeight: 900, letterSpacing: '-0.02em', color: '#e8e0d4', lineHeight: 1 }}>Settings</h1>
        <p style={{ fontSize: '14px', color: 'rgba(232,224,212,0.45)', marginTop: '6px', fontWeight: 300 }}>Configure your signal preferences and notifications</p>
      </div>

      {/* Two column layout */}
      <div className="st-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '20px', alignItems: 'start' }}>

        {/* Left — Signal Detection */}
        <div className="st-box">
          <div className="st-box-header">
            <Sliders size={13} style={{ color: 'rgba(232,224,212,0.5)' }} />
            <div>
              <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '11px', letterSpacing: '0.06em', color: 'rgba(232,224,212,0.7)' }}>Signal Detection</div>
              <div style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '11px', color: 'rgba(232,224,212,0.35)', fontWeight: 300 }}>Configure which signals to detect</div>
            </div>
          </div>
          <div className="st-box-body">

            {/* Min score */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <label className="st-label" style={{ margin: 0 }}>Minimum Signal Score</label>
                <span style={{ fontFamily: '"Playfair Display", serif', fontSize: '22px', fontWeight: 700, color: '#e8e0d4' }}>{settings.min_score}</span>
              </div>
              <Slider value={[settings.min_score || 60]} onValueChange={([v]) => setSettings({ ...settings, min_score: v })} min={30} max={90} step={5} />
              <p className="st-desc" style={{ marginTop: '8px' }}>Only show signals scoring {settings.min_score}+. Higher = stronger setups.</p>
            </div>

            <div style={{ height: '1px', background: 'rgba(232,224,212,0.06)', marginBottom: '16px' }} />

            {/* Signal types */}
            <label className="st-label">Enabled Signal Types</label>
            {SIGNAL_TYPES.map(signal => {
              const enabled = (settings.enabled_signals || []).includes(signal.id)
              return (
                <div key={signal.id} className={`st-signal-row ${enabled ? 'on' : ''}`}>
                  <div>
                    <div style={{ fontSize: '13px', color: enabled ? '#e8e0d4' : 'rgba(232,224,212,0.5)', fontWeight: 500 }}>{signal.label}</div>
                    <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '9px', color: 'rgba(232,224,212,0.3)', marginTop: '2px' }}>{signal.description}</div>
                  </div>
                  <div className={`st-switch ${enabled ? 'on' : ''}`} onClick={() => toggleSignal(signal.id)}>
                    <div className="st-knob" />
                  </div>
                </div>
              )
            })}

            <div style={{ height: '1px', background: 'rgba(232,224,212,0.06)', margin: '16px 0' }} />

            {/* Scan scope */}
            <div className="st-row" style={{ borderBottom: 'none', padding: '0' }}>
              <div>
                <div style={{ fontSize: '13px', color: 'rgba(232,224,212,0.8)', fontWeight: 500 }}>Scan Watchlist Only</div>
                <div className="st-desc">Only scan stocks in your watchlist</div>
              </div>
              <div className={`st-switch ${settings.scan_watchlist_only ? 'on' : ''}`} onClick={() => setSettings({ ...settings, scan_watchlist_only: !settings.scan_watchlist_only })}>
                <div className="st-knob" />
              </div>
            </div>
          </div>
        </div>

        {/* Right — Notifications + Save */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Notifications */}
          <div className="st-box">
            <div className="st-box-header">
              <Bell size={13} style={{ color: 'rgba(232,224,212,0.5)' }} />
              <div>
                <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '11px', letterSpacing: '0.06em', color: 'rgba(232,224,212,0.7)' }}>Notifications</div>
                <div style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '11px', color: 'rgba(232,224,212,0.35)', fontWeight: 300 }}>How to be notified about signals</div>
              </div>
            </div>
            <div className="st-box-body">
              <div className="st-row">
                <div>
                  <div style={{ fontSize: '13px', color: 'rgba(232,224,212,0.8)', fontWeight: 500 }}>Push Notifications</div>
                  <div className="st-desc">Browser alerts for high-priority signals</div>
                </div>
                <div className={`st-switch ${settings.push_notifications ? 'on' : ''}`} onClick={() => setSettings({ ...settings, push_notifications: !settings.push_notifications })}>
                  <div className="st-knob" />
                </div>
              </div>
              <div className="st-row">
                <div>
                  <div style={{ fontSize: '13px', color: 'rgba(232,224,212,0.8)', fontWeight: 500 }}>Daily Email Digest</div>
                  <div className="st-desc">Signal summary at end of trading day</div>
                </div>
                <div className={`st-switch ${settings.email_digest ? 'on' : ''}`} onClick={() => setSettings({ ...settings, email_digest: !settings.email_digest })}>
                  <div className="st-knob" />
                </div>
              </div>
            </div>
          </div>

          {/* Save */}
          <button className={`btn-save ${saved ? 'saved' : ''}`} onClick={saveSettings} disabled={isSaving}>
            {isSaving ? <Spinner className="h-3 w-3" /> : saved ? <CheckCircle size={14} /> : <Save size={14} />}
            {saved ? 'Saved!' : 'Save Settings'}
          </button>

          {saved && (
            <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '10px', color: '#7ec8a0', letterSpacing: '0.04em', textAlign: 'center' }}>
              Settings updated successfully
            </div>
          )}
        </div>
      </div>
    </div>
  )
}