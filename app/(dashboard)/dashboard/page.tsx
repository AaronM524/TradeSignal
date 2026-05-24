'use client'
import { useState } from 'react'
import useSWR from 'swr'
import { SignalCard } from '@/components/signals/signal-card'
import { QuoteCard } from '@/components/market/quote-card'
import { Spinner } from '@/components/ui/spinner'
import { TrendingUp, TrendingDown, Bell, RefreshCw, Eye, Activity, Zap } from 'lucide-react'
import type { TradeSignal, Quote } from '@/lib/types'
import Link from 'next/link'

const fetcher = (url: string) => fetch(url).then(r => r.json())
const MARKET_INDICES = ['SPY', 'QQQ', 'DIA', 'IWM']

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=DM+Mono:wght@300;400;500&family=DM+Sans:wght@300;400;500;600&display=swap');

  .stat-card { background: rgba(232,224,212,0.02); border: 1px solid rgba(232,224,212,0.08); padding: 20px 24px; transition: border-color 0.2s; }
  .stat-card:hover { border-color: rgba(232,224,212,0.15); }
  .stat-label { font-family: "DM Mono", monospace; font-size: 9px; letter-spacing: 0.1em; text-transform: uppercase; color: rgba(232,224,212,0.4); margin-bottom: 10px; display: flex; align-items: center; justify-content: space-between; }
  .stat-value { font-family: "Playfair Display", serif; font-size: 36px; font-weight: 900; letter-spacing: -0.02em; color: #e8e0d4; line-height: 1; }
  .stat-sub { font-family: "DM Sans", sans-serif; font-size: 12px; color: rgba(232,224,212,0.4); margin-top: 6px; font-weight: 300; }
  .section-title { font-family: "Playfair Display", serif; font-size: 22px; font-weight: 900; letter-spacing: -0.01em; color: #e8e0d4; }
  .section-sub { font-family: "DM Sans", sans-serif; font-size: 13px; color: rgba(232,224,212,0.45); margin-top: 2px; font-weight: 300; }
  .btn-primary { background: #e8e0d4; color: #0a0a0a; border: none; padding: 10px 20px; font-family: "DM Sans", sans-serif; font-size: 12px; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; cursor: pointer; transition: opacity 0.15s; display: flex; align-items: center; gap: 8px; white-space: nowrap; }
  .btn-primary:hover { opacity: 0.85; }
  .btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }
  .btn-ghost { background: transparent; color: rgba(232,224,212,0.55); border: 1px solid rgba(232,224,212,0.15); padding: 8px 16px; font-family: "DM Mono", monospace; font-size: 11px; letter-spacing: 0.05em; text-transform: uppercase; cursor: pointer; transition: all 0.15s; display: flex; align-items: center; gap: 6px; text-decoration: none; }
  .btn-ghost:hover { color: #e8e0d4; border-color: rgba(232,224,212,0.3); }
  .divider { width: 100%; height: 1px; background: rgba(232,224,212,0.07); }
  .tip-row { display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px solid rgba(232,224,212,0.05); font-family: "DM Sans", sans-serif; font-size: 13px; color: rgba(232,224,212,0.55); font-weight: 300; }
  .tip-badge { font-family: "DM Mono", monospace; font-size: 10px; padding: 2px 8px; border: 1px solid rgba(232,224,212,0.2); color: rgba(232,224,212,0.7); white-space: nowrap; }

  .db-card-wrap { display:flex;flex-direction:column; }
  .db-dismiss { display:flex;align-items:center;justify-content:center;background:none;border:1px solid rgba(232,224,212,0.08);color:rgba(232,224,212,0.25);padding:7px;font-family:"DM Mono",monospace;font-size:9px;letter-spacing:0.06em;text-transform:uppercase;cursor:pointer;transition:all 0.15s;width:100%;margin-top:4px; }
  .db-dismiss:hover { border-color:rgba(200,126,126,0.3);color:#c87e7e;background:rgba(200,126,126,0.04); }

  .db-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 32px; gap: 16px; }
  .db-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px; background: rgba(232,224,212,0.07); margin-bottom: 32px; }
  .db-market { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px; background: rgba(232,224,212,0.07); }
  .db-signals { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
  .db-signals-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 20px; gap: 16px; }

  @media (max-width: 768px) {
    .db-page { padding: 16px !important; }
    .db-stats { grid-template-columns: repeat(2, 1fr) !important; }
    .db-market { grid-template-columns: repeat(2, 1fr) !important; }
    .db-signals { grid-template-columns: 1fr !important; }
    .db-header { flex-direction: column; align-items: flex-start; }
    .db-signals-header { flex-direction: column; align-items: flex-start; }
    .stat-value { font-size: 28px !important; }
  }
`

export default function DashboardPage() {
  const [isScanning, setIsScanning] = useState(false)
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  const { data: indicesData, isLoading: indicesLoading } = useSWR(
    '/api/market/quotes?tickers=' + MARKET_INDICES.join(','),
    fetcher,
    { refreshInterval: 60000 }
  )

  const { data: signalsData, isLoading: signalsLoading, mutate: refreshSignals } = useSWR<{
    signals: TradeSignal[]
    scannedCount: number
    signalCount: number
  }>(
    '/api/signals/scan?minScore=55',
    fetcher,
    { refreshInterval: 300000 }
  )

  const handleManualScan = async () => {
    setIsScanning(true)
    setDismissed(new Set())
    await refreshSignals()
    setIsScanning(false)
  }

  const dismissSignal = (id: string) => setDismissed(prev => new Set([...prev, id]))

  const signals = (signalsData?.signals || []).filter(s => !dismissed.has(s.id))
  const highConfidenceSignals = signals.filter(s => s.confidence === 'high')
  const bullishSignals = signals.filter(s => s.signalType === 'bullish_entry')
  const bearishSignals = signals.filter(s => s.signalType === 'bearish_entry')

  return (
    <div className="db-page" style={{ padding: '32px 40px', fontFamily: '"DM Sans", sans-serif', color: '#e8e0d4', minHeight: '100vh', background: '#0a0a0a' }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* Header */}
      <div className="db-header">
        <div>
          <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(232,224,212,0.4)', marginBottom: '8px' }}>Overview</div>
          <h1 style={{ fontFamily: '"Playfair Display", serif', fontSize: '32px', fontWeight: 900, letterSpacing: '-0.02em', color: '#e8e0d4', lineHeight: 1 }}>Dashboard</h1>
          <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '14px', color: 'rgba(232,224,212,0.45)', marginTop: '6px', fontWeight: 300 }}>Real-time market signals and technical analysis</p>
        </div>
        <button className="btn-primary" onClick={handleManualScan} disabled={isScanning}>
          {isScanning ? <Spinner className="h-3 w-3" /> : <RefreshCw size={13} />}
          {isScanning ? 'Scanning...' : 'Scan for Signals'}
        </button>
      </div>

      {/* Stats */}
      <div className="db-stats">
        <div className="stat-card">
          <div className="stat-label">Active Signals <Bell size={11} /></div>
          <div className="stat-value">{signals.length}</div>
          <div className="stat-sub">{highConfidenceSignals.length} high confidence</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Bullish <TrendingUp size={11} /></div>
          <div className="stat-value" style={{ color: '#7ec8a0' }}>{bullishSignals.length}</div>
          <div className="stat-sub">Potential long entries</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Bearish <TrendingDown size={11} /></div>
          <div className="stat-value" style={{ color: '#c87e7e' }}>{bearishSignals.length}</div>
          <div className="stat-sub">Potential short entries</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Scanned <Activity size={11} /></div>
          <div className="stat-value">{signalsData?.scannedCount || 0}</div>
          <div className="stat-sub">Tickers analyzed</div>
        </div>
      </div>

      {/* Market Overview */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ marginBottom: '16px' }}>
          <div className="section-title">Market Overview</div>
          <div className="section-sub">Major indices performance</div>
        </div>
        {indicesLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '32px' }}>
            <Spinner className="h-6 w-6" />
          </div>
        ) : (
          <div className="db-market">
            {MARKET_INDICES.map(ticker => {
              const quote = indicesData?.quotes?.find((q: Quote) => q.ticker === ticker)
              if (!quote) return (
                <div key={ticker} style={{ background: '#0a0a0a', padding: '16px 20px' }}>
                  <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '14px', fontWeight: 500, color: '#e8e0d4' }}>{ticker}</div>
                  <div style={{ fontSize: '12px', color: 'rgba(232,224,212,0.3)', marginTop: '4px' }}>Loading...</div>
                </div>
              )
              return <QuoteCard key={ticker} quote={quote} compact showVolume={false} />
            })}
          </div>
        )}
      </div>

      <div className="divider" style={{ marginBottom: '32px' }} />

      {/* Latest Signals */}
      <div>
        <div className="db-signals-header">
          <div>
            <div className="section-title">Latest Signals</div>
            <div className="section-sub">Trade setups detected by the signal engine</div>
          </div>
          <Link href="/signals" className="btn-ghost">
            View All <Eye size={12} />
          </Link>
        </div>

        {signalsLoading || isScanning ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '64px 0' }}>
            <Spinner className="h-8 w-8" />
            <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '11px', color: 'rgba(232,224,212,0.35)', marginTop: '16px', letterSpacing: '0.06em' }}>
              {isScanning ? 'SCANNING MARKETS...' : 'LOADING SIGNALS...'}
            </p>
          </div>
        ) : signals.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '64px 0', border: '1px solid rgba(232,224,212,0.07)' }}>
            <Zap size={32} strokeWidth={1} style={{ color: 'rgba(232,224,212,0.2)', marginBottom: '16px' }} />
            <div style={{ fontFamily: '"Playfair Display", serif', fontSize: '20px', fontWeight: 700, color: 'rgba(232,224,212,0.5)', marginBottom: '8px' }}>No signals detected</div>
            <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '13px', color: 'rgba(232,224,212,0.3)', marginBottom: '24px', fontWeight: 300 }}>
              Click &quot;Scan for Signals&quot; to analyze the market
            </p>
            <button className="btn-primary" onClick={handleManualScan}>
              <Zap size={13} /> Start Scanning
            </button>
          </div>
        ) : (
          <div className="db-signals">
            {signals.slice(0, 6).map(signal => (
              <div key={signal.id} className="db-card-wrap">
                <SignalCard signal={signal} onViewDetails={(s) => console.log('View signal:', s)} />
                <button className="db-dismiss" onClick={() => dismissSignal(signal.id)}>Dismiss</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Scoring tips */}
      <div style={{ marginTop: '40px', border: '1px solid rgba(232,224,212,0.07)', padding: '24px' }}>
        <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(232,224,212,0.35)', marginBottom: '16px' }}>How Signal Scoring Works</div>
        <div>
          {[
            { badge: '75+', label: 'High confidence — Multiple indicators align' },
            { badge: '55–74', label: 'Medium confidence — Some indicators align' },
            { badge: 'Below 55', label: 'Low confidence — Consider with caution' },
          ].map((tip, i) => (
            <div key={i} className="tip-row">
              <span className="tip-badge">{tip.badge}</span>
              <span>{tip.label}</span>
            </div>
          ))}
        </div>
        <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '12px', color: 'rgba(232,224,212,0.3)', marginTop: '16px', fontWeight: 300 }}>
          Signals are based on RSI, MACD, EMA, and ATR. Always do your own research before trading.
        </p>
      </div>
    </div>
  )
}