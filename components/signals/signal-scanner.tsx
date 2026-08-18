'use client'

import { useState, useEffect, useCallback } from 'react'
import { Zap, Activity, Pause, Play } from 'lucide-react'
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
  const [signalCount, setSignalCount] = useState(0)
  const [highConfidenceCount, setHighConfidenceCount] = useState(0)
  const [autoScanEnabled, setAutoScanEnabled] = useState(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem(AUTO_SCAN_KEY) === 'true'
  })
  const { toast } = useToast()

  const toggleAutoScan = () => {
    const next = !autoScanEnabled
    setAutoScanEnabled(next)
    localStorage.setItem(AUTO_SCAN_KEY, String(next))
    toast({
      title: next ? 'Auto-scan enabled' : 'Auto-scan disabled',
      description: next ? 'Scanner will run automatically.' : 'Use Scan Now to scan manually.',
    })
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
  }, [isScanning, onNewSignals, toast])

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
    </div>
  )
}