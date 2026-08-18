'use client'

import { useState, useEffect } from 'react'
import { Spinner } from '@/components/ui/spinner'
import { Slider } from '@/components/ui/slider'
import { Save, CheckCircle, Sliders, AlertTriangle } from 'lucide-react'
import type { DbSignalSettings } from '@/lib/types'

const SIGNAL_TYPES = [
  { id: 'RSI', label: 'RSI Reversals', description: 'Oversold bounces and overbought rejections' },
  { id: 'MACD', label: 'MACD Crossovers', description: 'Bullish and bearish momentum shifts' },
  { id: 'VWAP', label: 'VWAP Reclaims', description: 'Price reclaiming volume weighted average' },
  { id: 'VOLUME', label: 'Volume Spikes', description: 'Unusual volume activity' },
  { id: 'OPTIONS_FLOW', label: 'Options Flow', description: 'Unusual options activity correlation' },
  { id: 'MA_CROSS', label: 'Moving Average Cross', description: '9/21 EMA and 50/200 SMA crosses' },
]

// Notifications aren't built yet — these stay off/false regardless of what's in
// the database, so the feature is fully scrapped from the user's perspective
// without needing a schema or API change.
const DEFAULT_SETTINGS: Partial<DbSignalSettings> = {
  min_score: 60,
  enabled_signals: ['RSI', 'MACD', 'VWAP', 'VOLUME', 'OPTIONS_FLOW'],
  push_notifications: false,
  email_digest: false,
  scan_watchlist_only: false,
}

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
  .st-switch { width: 36px; height: 20px; border-radius: 10px; border: 1px solid rgba(232,224,212,0.2); background: rgba(232,224,212,0.05); cursor: pointer; position: relative; transition: all 0.2s; flex-shrink: 0; padding: 0; font: inherit; }
  .st-switch.on { background: rgba(232,224,212,0.2); border-color: rgba(232,224,212,0.4); }
  .st-switch:focus-visible { outline: 2px solid #e8e0d4; outline-offset: 2px; }
  .st-knob { width: 14px; height: 14px; border-radius: 50%; background: #e8e0d4; position: absolute; top: 2px; left: 2px; transition: transform 0.2s; pointer-events: none; }
  .st-switch.on .st-knob { transform: translateX(16px); }
  .st-footer { display: flex; align-items: center; justify-content: flex-end; gap: 16px; margin-top: 20px; flex-wrap: wrap; }
  .btn-save { display: inline-flex; align-items: center; gap: 8px; padding: 12px 28px; background: #e8e0d4; color: #0a0a0a; border: none; font-family: "DM Sans", sans-serif; font-size: 13px; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; cursor: pointer; transition: opacity 0.15s; }
  .btn-save:hover { opacity: 0.85; }
  .btn-save:disabled { opacity: 0.4; cursor: not-allowed; }
  .st-banner { display: flex; align-items: flex-start; gap: 8px; padding: 10px 12px; font-family: "DM Sans", sans-serif; font-size: 12px; margin-bottom: 16px; }
  .st-banner.warn { border: 1px solid rgba(200,126,126,0.3); background: rgba(200,126,126,0.05); color: #c87e7e; }
  .st-unsaved { font-family: "DM Mono", monospace; font-size: 10px; color: rgba(232,224,212,0.4); letter-spacing: 0.04em; }
  .st-saved { font-family: "DM Mono", monospace; font-size: 10px; color: #7ec8a0; letter-spacing: 0.04em; }
  @media (max-width: 768px) {
    .st-page { padding: 16px !important; }
    .st-box-header { flex-wrap: wrap; }
    .st-footer { justify-content: stretch !important; }
    .btn-save { width: 100%; justify-content: center; }
  }
`

function ToggleSwitch({
  checked,
  label,
  onToggle,
}: {
  checked: boolean
  label: string
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={`st-switch ${checked ? 'on' : ''}`}
      onClick={onToggle}
    >
      <span className="st-knob" />
    </button>
  )
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Partial<DbSignalSettings>>(DEFAULT_SETTINGS)
  const [savedSettings, setSavedSettings] = useState<Partial<DbSignalSettings>>(DEFAULT_SETTINGS)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  const hasUnsavedChanges = JSON.stringify(settings) !== JSON.stringify(savedSettings)

  useEffect(() => { loadSettings() }, [])

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!hasUnsavedChanges) return
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [hasUnsavedChanges])

  const loadSettings = async () => {
    setIsLoading(true)
    setLoadError(null)
    try {
      const res = await fetch('/api/settings')
      if (!res.ok) throw new Error(`Request failed (${res.status})`)
      const data = await res.json()
      // Notifications stay forced off regardless of what's stored, since the
      // feature isn't live — this keeps old saved `true` values from resurfacing.
      const normalized = { ...data, push_notifications: false, email_digest: false }
      setSettings(normalized)
      setSavedSettings(normalized)
    } catch (e) {
      console.error('Failed to load settings:', e)
      setLoadError('Couldn\u2019t load your saved settings — showing defaults. Anything you save now will still work.')
    } finally {
      setIsLoading(false)
    }
  }

  const saveSettings = async () => {
    setIsSaving(true)
    setSaved(false)
    setSaveError(null)
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          minScore: settings.min_score,
          enabledSignals: settings.enabled_signals,
          pushNotifications: false,
          emailDigest: false,
          scanWatchlistOnly: settings.scan_watchlist_only,
        }),
      })
      if (!res.ok) throw new Error(`Request failed (${res.status})`)
      const data = await res.json()
      setSettings(data)
      setSavedSettings(data)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e) {
      console.error('Failed to save settings:', e)
      setSaveError('Couldn\u2019t save your settings. Check your connection and try again.')
    } finally {
      setIsSaving(false)
    }
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
        <p style={{ fontSize: '14px', color: 'rgba(232,224,212,0.45)', marginTop: '6px', fontWeight: 300 }}>Configure your signal detection preferences</p>
      </div>

      {loadError && (
        <div className="st-banner warn">
          <AlertTriangle size={13} style={{ flexShrink: 0, marginTop: '1px' }} />
          <span>{loadError}</span>
        </div>
      )}

      {/* Single column — Signal Detection */}
      <div>
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
                  <ToggleSwitch checked={enabled} label={signal.label} onToggle={() => toggleSignal(signal.id)} />
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
              <ToggleSwitch
                checked={!!settings.scan_watchlist_only}
                label="Scan Watchlist Only"
                onToggle={() => setSettings({ ...settings, scan_watchlist_only: !settings.scan_watchlist_only })}
              />
            </div>
          </div>
        </div>

        {saveError && (
          <div className="st-banner warn" style={{ marginTop: '16px', marginBottom: 0 }}>
            <AlertTriangle size={13} style={{ flexShrink: 0, marginTop: '1px' }} />
            <span>{saveError}</span>
          </div>
        )}

        <div className="st-footer">
          {saved && <span className="st-saved">Settings updated successfully</span>}
          {!saved && !isSaving && hasUnsavedChanges && <span className="st-unsaved">You have unsaved changes</span>}
          <button className="btn-save" onClick={saveSettings} disabled={isSaving}>
            {isSaving ? <Spinner className="h-3 w-3" /> : saved ? <CheckCircle size={14} /> : <Save size={14} />}
            {isSaving ? 'Saving...' : saved ? 'Saved!' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  )
}