'use client'

import { useState, useEffect, useCallback } from 'react'
import { Bell, BellOff, Zap, Activity, Pause, Play } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import type { TradeSignal } from '@/lib/types'

interface SignalScannerProps {
  watchlistTickers?: string[]
  onNewSignals?: (signals: TradeSignal[]) => void
  scanInterval?: number
}

const AUTO_SCAN_KEY = 'tradesignal_autoscan'

const CSS = `
  .scanner-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    background: transparent;
    border: 1px solid rgba(232,224,212,0.15);
    color: rgba(232,224,212,0.55);
    font-family: "DM Mono", monospace;
    font-size: 10px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    cursor: pointer;
    transition: all 0.15s;
  }
  .scanner-btn:hover {
    border-color: rgba(232,224,212,0.35);
    color: rgba(232,224,212,0.85);
  }
  .scanner-btn.active {
    border-color: rgba(232,224,212,0.4);
    color: #e8e0d4;
  }
  .scanner-badge {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 10px;
    border: 1px solid rgba(232,224,212,0.12);
    font-family: "DM Mono", monospace;
    font-size: 10px;
    color: rgba(232,224,212,0.45);
    letter-spacing: 0.04em;
  }
  .scanner-badge.high {
    border-color: rgba(126,200,160,0.3);
    color: #7ec8a0;
  }
`

export function SignalScanner({
  watchlistTickers = [],
  onNewSignals,
  scanInterval = 60000
}: SignalScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [lastScan, setLastScan] = useState<Date | null>(null)
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default')
  const [signalCount, setSignalCount] = useState(0)
  const [highConfidenceCount, setHighConfidenceCount] = useState(0)
  const [autoScanEnabled, setAutoScanEnabled] = useState(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem(AUTO_SCAN_KEY) === 'true'
  })
  const { toast } = useToast()

  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission)
      setNotificationsEnabled(Notification.permission === 'granted')
    }
  }, [])

  const toggleAutoScan = () => {
    const next = !autoScanEnabled
    setAutoScanEnabled(next)
    localStorage.setItem(AUTO_SCAN_KEY, String(next))
    toast({
      title: next ? 'Auto-scan enabled' : 'Auto-scan disabled',
      description: next ? 'Scanner will run automatically.' : 'Use Scan Now to scan manually.',
    })
  }

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      toast({ title: 'Notifications not supported', variant: 'destructive' })
      return
    }
    const permission = await Notification.requestPermission()
    setNotificationPermission(permission)
    setNotificationsEnabled(permission === 'granted')
    if (permission === 'granted') {
      toast({ title: 'Notifications enabled' })
    }
  }

  const playNotificationSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      oscillator.frequency.value = 800
      oscillator.type = 'sine'
      gainNode.gain.value = 0.3
      oscillator.start()
      setTimeout(() => { oscillator.stop(); audioContext.close() }, 200)
    } catch { /* silent fail */ }
  }

  const sendNotification = (signal: TradeSignal) => {
    if (!notificationsEnabled || notificationPermission !== 'granted') return
    const icon = signal.signalType === 'bullish_entry' ? '📈' : '📉'
    const title = `${icon} ${signal.ticker} - ${signal.signalType === 'bullish_entry' ? 'Bullish' : 'Bearish'} Signal`
    const body = `Score: ${signal.score} | Entry: $${(signal.entry ?? signal.entryPrice ?? 0).toFixed(2)} | Target: $${(signal.target ?? signal.targetPrice ?? 0).toFixed(2)}`
    if (signal.score >= 80) playNotificationSound()
    new Notification(title, { body, icon: '/favicon.ico', tag: signal.id, requireInteraction: true })
  }

  const scanForSignals = useCallback(async () => {
    if (isScanning) return
    setIsScanning(true)
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000)
      const response = await fetch('/api/signals/scan?minScore=50', { signal: controller.signal })
      clearTimeout(timeoutId)
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      const data = await response.json()
      const newSignals: TradeSignal[] = data.signals || []
      setSignalCount(newSignals.length)
      setHighConfidenceCount(newSignals.filter(s => s.score >= 70).length)
      for (const signal of newSignals) {
        if (signal.score >= 70) {
          sendNotification(signal)
          toast({
            title: `${signal.signalType === 'bullish_entry' ? '▲' : '▼'} New Signal: ${signal.ticker}`,
            description: `Score: ${signal.score} — ${signal.triggers?.map(t => t.type).join(', ') || 'Multiple indicators'}`,
          })
        }
      }
      if (onNewSignals) onNewSignals(newSignals)
      setLastScan(new Date())
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Error scanning for signals:', error)
      }
    } finally {
      setIsScanning(false)
    }
  }, [isScanning, notificationsEnabled, notificationPermission, onNewSignals, toast])

  useEffect(() => {
    if (!autoScanEnabled) return
    let mounted = true
    const initialDelay = setTimeout(async () => {
      if (mounted) await scanForSignals()
    }, 5000)
    const interval = setInterval(() => {
      if (mounted) scanForSignals()
    }, scanInterval)
    return () => {
      mounted = false
      clearTimeout(initialDelay)
      clearInterval(interval)
    }
  }, [autoScanEnabled, scanInterval, scanForSignals])

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* Signal count badges */}
      {signalCount > 0 && (
        <div style={{ display: 'flex', gap: '6px' }}>
          {highConfidenceCount > 0 && (
            <span className="scanner-badge high">{highConfidenceCount} High</span>
          )}
          <span className="scanner-badge">{signalCount} signals</span>
        </div>
      )}

      {/* Scan status */}
      {isScanning ? (
        <span className="scanner-badge">
          <Activity size={10} style={{ animation: 'pulse 1s infinite' }} />
          Scanning...
        </span>
      ) : (
        <span className="scanner-badge">
          <Zap size={10} />
          {lastScan ? lastScan.toLocaleTimeString() : 'Ready'}
        </span>
      )}

      {/* Auto-scan toggle */}
      <button
        className={`scanner-btn ${autoScanEnabled ? 'active' : ''}`}
        onClick={toggleAutoScan}
        title={autoScanEnabled ? 'Auto-scan ON — click to pause' : 'Auto-scan OFF — click to enable'}
      >
        {autoScanEnabled ? <Pause size={10} /> : <Play size={10} />}
        Auto {autoScanEnabled ? 'On' : 'Off'}
      </button>

      {/* Alerts toggle */}
      <button
        className={`scanner-btn ${notificationsEnabled ? 'active' : ''}`}
        onClick={notificationsEnabled ? () => setNotificationsEnabled(false) : requestNotificationPermission}
      >
        {notificationsEnabled ? <Bell size={10} /> : <BellOff size={10} />}
        {notificationsEnabled ? 'Alerts On' : 'Enable Alerts'}
      </button>
    </div>
  )
}