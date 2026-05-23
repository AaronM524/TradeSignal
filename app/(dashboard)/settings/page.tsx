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

  .st-section { border: 1px solid rgba(232,224,212,0.08); margin-bottom: 20px; }
  .st-section-header { padding: 18px 24px; border-bottom: 1px solid rgba(232,224,212,0.07); display: flex; align-items: center; gap: 10px; }
  .st-section-body { padding: 24px; }

  .st-label { font-family: "DM Mono", monospace; font-size: 9px; letter-spacing: 0.1em; text-transform: uppercase; color: rgba(232,224,212,0.45); margin-bottom: 6px; display: block; }
  .st-desc { font-family: "DM Sans", sans-serif; font-size: 12px; color: rgba(232,224,212,0.4); font-weight: 300; margin-top: 3px; }

  .st-row { display: flex; align-items: center; justify-content: space-between; padding: 14px 0; border-bottom: 1px solid rgba(232,224,212,0.05); }
  .st-row:last-child { border-bottom: none; }

  .st-switch { width: 36px; height: 20px; border-radius: 10px; border: 1px solid rgba(232,224,212,0.2); background: rgba(232,224,212,0.05); cursor: pointer; position: relative; transition: all 0.2s; flex-shrink: 0; }
  .st-switch.on { background: rgba(232,224,212,0.2); border-color: rgba(232,224,212,0.4); }
  .st-switch-knob { width: 14px; height: 14px; border-radius: 50%; background: #e8e0d4; position: absolute; top: 2px; left: 2px; transition: transform 0.2s; }
  .st-switch.on .st-switch-knob { transform: translateX(16px); }

  .st-signal-row { display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; border: 1px solid rgba(232,224,212,0.07); margin-bottom: 6px; transition: border-color 0.15s; }
  .st-signal-row:hover { border-color: rgba(232,224,212,0.15); }
  .st-signal-row.enabled { border-color: rgba(232,224,212,0.18); background: rgba(232,224,212,0.02); }

  .btn-save { display: flex; align-items: center; gap: 8px; padding: 12px 28px; background: #e8e0d4; color: #0a0a0a; border: none; font-family: "DM Sans", sans-serif; font-size: 13px; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; cursor: pointer; transition: opacity 0.15s; }
  .btn-save:hover { opacity: 0.85; }
  .btn-save:disabled { opacity: 0.4; cursor: not-allowed; }
  .btn-save.saved { background: rgba(126,200,160,0.15); color: #7ec8a0; border: 1px solid rgba(126,200,160,0.3); }
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
    } catch (e) {
      console.error('Error loading settings:', e)
    } finally {
      setIsLoading(false)
    }
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
    } catch (e) {
      console.error('Error saving settings:', e)
    } finally {
      setIsSaving(false)
    }
  }

  const toggleSignal = (id: string) => {
    const current = settings.enabled_signals || []
    setSettings({ ...settings, enabled_signals: current.includes(id) ? current.filter(s => s !== id) : [...current, id] })
  }

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '64px' }}>
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  return (
    <div style={{ padding: '32px 40px', fontFamily: '"DM Sans", sans-serif', color: '#e8e0d4', minHeight: '100vh', background: '#0a0a0a', maxWidth: '680px' }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(232,224,212,0.4)', marginBottom: '8px' }}>Preferences</div>
        <h1 style={{ fontFamily: '"Playfair Display", serif', fontSize: '32px', fontWeight: 900, letterSpacing: '-0.02em', color: '#e8e0d4', lineHeight: 1 }}>Settings</h1>
        <p style={{ fontSize: '14px', color: 'rgba(232,224,212,0.45)', marginTop: '6px', fontWeight: 300 }}>Configure your signal preferences and notifications</p>
      </div>

      {/* Signal Detection */}
      <div className="st-section">
        <div className="st-section-header">
          <Sliders size={14} style={{ color: 'rgba(232,224,212,0.5)' }} />
          <div>
            <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '11px', letterSpacing: '0.06em', color: 'rgba(232,224,212,0.7)' }}>Signal Detection</div>
            <div style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '12px', color: 'rgba(232,224,212,0.35)', fontWeight: 300 }}>Configure which signals to detect and minimum score threshold</div>
          </div>
        </div>
        <div className="st-section-body">

          {/* Min score slider */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <label className="st-label" style={{ margin: 0 }}>Minimum Signal Score</label>
              <span style={{ fontFamily: '"Playfair Display", serif', fontSize: '24px', fontWeight: 700, color: '#e8e0d4' }}>{settings.min_score}</span>
            </div>
            <Slider
              value={[settings.min_score || 60]}
              onValueChange={([v]) => setSettings({ ...settings, min_score: v })}
              min={30} max={90} step={5}
            />
            <p className="st-desc" style={{ marginTop: '10px' }}>
              Only show signals with a score of {settings.min_score}+. Higher scores indicate stronger setups.
            </p>
          </div>

          <div style={{ height: '1px', background: 'rgba(232,224,212,0.06)', marginBottom: '20px' }} />

          {/* Signal types */}
          <div>
            <label className="st-label">Enabled Signal Types</label>
            {SIGNAL_TYPES.map(signal => {
              const enabled = (settings.enabled_signals || []).includes(signal.id)
              return (
                <div key={signal.id} className={`st-signal-row ${enabled ? 'enabled' : ''}`}>
                  <div>
                    <div style={{ fontSize: '13px', color: enabled ? '#e8e0d4' : 'rgba(232,224,212,0.55)', fontWeight: 500 }}>{signal.label}</div>
                    <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '10px', color: 'rgba(232,224,212,0.3)', marginTop: '2px', letterSpacing: '0.02em' }}>{signal.description}</div>
                  </div>
                  <div className={`st-switch ${enabled ? 'on' : ''}`} onClick={() => toggleSignal(signal.id)}>
                    <div className="st-switch-knob" />
                  </div>
                </div>
              )
            })}
          </div>

          <div style={{ height: '1px', background: 'rgba(232,224,212,0.06)', margin: '20px 0' }} />

          {/* Scan scope */}
          <div className="st-row" style={{ borderBottom: 'none', paddingBottom: 0 }}>
            <div>
              <div style={{ fontSize: '13px', color: 'rgba(232,224,212,0.8)', fontWeight: 500 }}>Scan Watchlist Only</div>
              <div className="st-desc">Only scan stocks in your watchlist instead of the full market</div>
            </div>
            <div className={`st-switch ${settings.scan_watchlist_only ? 'on' : ''}`} onClick={() => setSettings({ ...settings, scan_watchlist_only: !settings.scan_watchlist_only })}>
              <div className="st-switch-knob" />
            </div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="st-section">
        <div className="st-section-header">
          <Bell size={14} style={{ color: 'rgba(232,224,212,0.5)' }} />
          <div>
            <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '11px', letterSpacing: '0.06em', color: 'rgba(232,224,212,0.7)' }}>Notifications</div>
            <div style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '12px', color: 'rgba(232,224,212,0.35)', fontWeight: 300 }}>Choose how you want to be notified about new signals</div>
          </div>
        </div>
        <div className="st-section-body">
          <div className="st-row">
            <div>
              <div style={{ fontSize: '13px', color: 'rgba(232,224,212,0.8)', fontWeight: 500 }}>Push Notifications</div>
              <div className="st-desc">Get browser notifications for high-priority signals</div>
            </div>
            <div className={`st-switch ${settings.push_notifications ? 'on' : ''}`} onClick={() => setSettings({ ...settings, push_notifications: !settings.push_notifications })}>
              <div className="st-switch-knob" />
            </div>
          </div>
          <div className="st-row">
            <div>
              <div style={{ fontSize: '13px', color: 'rgba(232,224,212,0.8)', fontWeight: 500 }}>Daily Email Digest</div>
              <div className="st-desc">Receive a summary of signals at the end of each trading day</div>
            </div>
            <div className={`st-switch ${settings.email_digest ? 'on' : ''}`} onClick={() => setSettings({ ...settings, email_digest: !settings.email_digest })}>
              <div className="st-switch-knob" />
            </div>
          </div>
        </div>
      </div>

      {/* Save */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button className={`btn-save ${saved ? 'saved' : ''}`} onClick={saveSettings} disabled={isSaving}>
          {isSaving ? <Spinner className="h-3 w-3" /> : saved ? <CheckCircle size={14} /> : <Save size={14} />}
          {saved ? 'Saved!' : 'Save Settings'}
        </button>
        {saved && <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '11px', color: '#7ec8a0', letterSpacing: '0.04em' }}>Settings updated successfully</span>}
      </div>
    </div>
  )
}