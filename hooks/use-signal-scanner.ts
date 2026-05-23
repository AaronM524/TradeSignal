"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useNotifications } from "./use-notifications"
import type { TradeSignal } from "@/lib/types"

interface ScannerOptions {
  tickers: string[]
  minScore?: number
  enabled?: boolean
  intervalMs?: number
}

export function useSignalScanner({
  tickers,
  minScore = 60,
  enabled = true,
  intervalMs = 60000, // 1 minute default
}: ScannerOptions) {
  const [signals, setSignals] = useState<TradeSignal[]>([])
  const [isScanning, setIsScanning] = useState(false)
  const [lastScan, setLastScan] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  const { sendSignalNotification, permission } = useNotifications()
  const notifiedSignalsRef = useRef<Set<string>>(new Set())

  const scan = useCallback(async () => {
    if (tickers.length === 0) return
    
    setIsScanning(true)
    setError(null)
    
    try {
      const tickerParam = tickers.join(",")
      const response = await fetch(`/api/signals/scan?tickers=${tickerParam}&minScore=${minScore}`)
      
      if (!response.ok) {
        throw new Error("Failed to scan for signals")
      }
      
      const data = await response.json()
      const newSignals: TradeSignal[] = data.signals || []
      
      // Check for new high-priority signals to notify
      if (permission === "granted") {
        newSignals.forEach(signal => {
          const signalKey = `${signal.ticker}-${signal.signalType}-${signal.score}`
          
          if (signal.score >= minScore && !notifiedSignalsRef.current.has(signalKey)) {
            notifiedSignalsRef.current.add(signalKey)
            sendSignalNotification(
              signal.ticker,
              signal.signalType,
              signal.score,
              signal.triggers.map(t => t.type)
            )
          }
        })
      }
      
      setSignals(newSignals)
      setLastScan(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setIsScanning(false)
    }
  }, [tickers, minScore, permission, sendSignalNotification])

  // Auto-scan on interval
  useEffect(() => {
    if (!enabled || tickers.length === 0) return
    
    // Initial scan
    scan()
    
    // Set up interval
    const interval = setInterval(scan, intervalMs)
    
    return () => clearInterval(interval)
  }, [enabled, tickers, intervalMs, scan])

  // Clear notified signals periodically (every 5 minutes)
  useEffect(() => {
    const interval = setInterval(() => {
      notifiedSignalsRef.current.clear()
    }, 5 * 60 * 1000)
    
    return () => clearInterval(interval)
  }, [])

  return {
    signals,
    isScanning,
    lastScan,
    error,
    scan,
  }
}
