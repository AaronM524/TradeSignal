'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Spinner } from '@/components/ui/spinner'
import { SignalCard } from '@/components/signals/signal-card'
import { RefreshCw, Zap, TrendingUp, TrendingDown, Bell } from 'lucide-react'
import type { TradeSignal } from '@/lib/types'

const fetcher = (url: string) => fetch(url).then(r => r.json())

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Mono:wght@300;400;500&family=DM+Sans:wght@300;400;500;600&display=swap');
  .sig-btn { display:flex;align-items:center;gap:6px;padding:8px 16px;background:transparent;border:1px solid rgba(232,224,212,0.18);color:rgba(232,224,212,0.65);font-family:"DM Mono",monospace;font-size:10px;letter-spacing:0.06em;text-transform:uppercase;cursor:pointer;transition:all 0.15s; }
  .sig-btn:hover { border-color:rgba(232,224,212,0.4);color:#e8e0d4; }
  .sig-btn:disabled { opacity:0.35;cursor:not-allowed; }
  .sig-btn.primary { background:#e8e0d4;color:#0a0a0a;border-color:#e8e0d4;font-weight:600; }
  .sig-select { background:rgba(232,224,212,0.04);border:1px solid rgba(232,224,212,0.15);color:rgba(232,224,212,0.7);padding:8px 12px;font-family:"DM Mono",monospace;font-size:10px;letter-spacing:0.06em;outline:none;cursor:pointer; }
  .sig-tab { padding:8px 16px;font-family:"DM Mono",monospace;font-size:10px;letter-spacing:0.06em;text-transform:uppercase;color:rgba(232,224,212,0.4);cursor:pointer;border-bottom:2px solid transparent;transition:all 0.15s;background:none;border-top:none;border-left:none;border-right:none; }
  .sig-tab:hover { color:rgba(232,224,212,0.7); }
  .sig-tab.active { color:#e8e0d4;border-bottom-color:#e8e0d4; }
  .stat-card { background:rgba(232,224,212,0.02);border:1px solid rgba(232,224,212,0.08);padding:20px 24px;cursor:pointer;transition:all 0.2s; }
  .stat-card:hover { border-color:rgba(232,224,212,0.15); }
  .stat-card.active { border-color:rgba(232,224,212,0.35);background:rgba(232,224,212,0.04); }
`

export default function SignalsPage() {
  const [isScanning, setIsScanning] = useState(false)
  const [minScore, setMinScore] = useState('30')
  const [signalFilter, setSignalFilter] = useState<'all'|'bullish'|'bearish'>('all')
  const [tab, setTab] = useState<'high'|'medium'|'all'>('high')

  const { data, isLoading, mutate: refreshSignals } = useSWR<{ signals: TradeSignal[]; scannedCount: number }>(
    `/api/signals/scan?minScore=${minScore}`,
    fetcher,
    { refreshInterval: 0, revalidateOnFocus: true }
  )

  const handleScan = async () => {
    setIsScanning(true)
    await refreshSignals()
    setIsScanning(false)
  }

  const signals = data?.signals || []
  const filtered = signals.filter(s => {
    if (signalFilter === 'bullish') return s.signalType === 'bullish_entry'
    if (signalFilter === 'bearish') return s.signalType === 'bearish_entry'
    return true
  })
  const high = filtered.filter(s => s.confidence === 'high')
  const medium = filtered.filter(s => s.confidence === 'medium')
  const tabSignals = tab === 'high' ? high : tab === 'medium' ? medium : filtered

  return (
    <div style={{ padding:'32px 40px', fontFamily:'"DM Sans",sans-serif', color:'#e8e0d4', minHeight:'100vh', background:'#0a0a0a' }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'32px' }}>
        <div>
          <div style={{ fontFamily:'"DM Mono",monospace', fontSize:'10px', letterSpacing:'0.1em', textTransform:'uppercase', color:'rgba(232,224,212,0.4)', marginBottom:'8px' }}>Detection</div>
          <h1 style={{ fontFamily:'"Playfair Display",serif', fontSize:'32px', fontWeight:900, letterSpacing:'-0.02em', color:'#e8e0d4', lineHeight:1 }}>Trade Signals</h1>
          <p style={{ fontSize:'14px', color:'rgba(232,224,212,0.45)', marginTop:'6px', fontWeight:300 }}>Automated detection of potential trade setups</p>
        </div>
        <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
          <select className="sig-select" value={minScore} onChange={e => setMinScore(e.target.value)}>
            <option value="30">Score 30+</option>
            <option value="40">Score 40+</option>
            <option value="50">Score 50+</option>
            <option value="60">Score 60+</option>
            <option value="70">Score 70+</option>
          </select>
          <button className="sig-btn primary" onClick={handleScan} disabled={isScanning}>
            {isScanning ? <Spinner className="h-3 w-3" /> : <RefreshCw size={11} />}
            Scan Now
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1px', background:'rgba(232,224,212,0.07)', marginBottom:'32px' }}>
        <div className={`stat-card ${signalFilter==='all'?'active':''}`} onClick={() => setSignalFilter('all')}>
          <div style={{ fontFamily:'"DM Mono",monospace', fontSize:'9px', letterSpacing:'0.1em', textTransform:'uppercase', color:'rgba(232,224,212,0.4)', marginBottom:'10px', display:'flex', justifyContent:'space-between' }}>All Signals <Bell size={11} /></div>
          <div style={{ fontFamily:'"Playfair Display",serif', fontSize:'36px', fontWeight:900, color:'#e8e0d4', lineHeight:1 }}>{filtered.length}</div>
          <div style={{ fontSize:'12px', color:'rgba(232,224,212,0.4)', marginTop:'6px', fontWeight:300 }}>{high.length} high · {medium.length} medium</div>
        </div>
        <div className={`stat-card ${signalFilter==='bullish'?'active':''}`} onClick={() => setSignalFilter('bullish')}>
          <div style={{ fontFamily:'"DM Mono",monospace', fontSize:'9px', letterSpacing:'0.1em', textTransform:'uppercase', color:'rgba(232,224,212,0.4)', marginBottom:'10px', display:'flex', justifyContent:'space-between' }}>Bullish <TrendingUp size={11} /></div>
          <div style={{ fontFamily:'"Playfair Display",serif', fontSize:'36px', fontWeight:900, color:'#7ec8a0', lineHeight:1 }}>{signals.filter(s=>s.signalType==='bullish_entry').length}</div>
          <div style={{ fontSize:'12px', color:'rgba(232,224,212,0.4)', marginTop:'6px', fontWeight:300 }}>Long entry opportunities</div>
        </div>
        <div className={`stat-card ${signalFilter==='bearish'?'active':''}`} onClick={() => setSignalFilter('bearish')}>
          <div style={{ fontFamily:'"DM Mono",monospace', fontSize:'9px', letterSpacing:'0.1em', textTransform:'uppercase', color:'rgba(232,224,212,0.4)', marginBottom:'10px', display:'flex', justifyContent:'space-between' }}>Bearish <TrendingDown size={11} /></div>
          <div style={{ fontFamily:'"Playfair Display",serif', fontSize:'36px', fontWeight:900, color:'#c87e7e', lineHeight:1 }}>{signals.filter(s=>s.signalType==='bearish_entry').length}</div>
          <div style={{ fontSize:'12px', color:'rgba(232,224,212,0.4)', marginTop:'6px', fontWeight:300 }}>Short entry opportunities</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', borderBottom:'1px solid rgba(232,224,212,0.08)', marginBottom:'24px' }}>
        {([['high','High Confidence',high.length],['medium','Medium',medium.length],['all','All',filtered.length]] as const).map(([id,label,count]) => (
          <button key={id} className={`sig-tab ${tab===id?'active':''}`} onClick={() => setTab(id)}>
            {label} <span style={{ opacity:0.5, marginLeft:'4px' }}>({count})</span>
          </button>
        ))}
      </div>

      {/* Signal grid */}
      {isLoading || isScanning ? (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'64px' }}>
          <Spinner className="h-8 w-8" />
          <p style={{ fontFamily:'"DM Mono",monospace', fontSize:'11px', color:'rgba(232,224,212,0.35)', marginTop:'16px', letterSpacing:'0.06em' }}>
            {isScanning ? 'SCANNING MARKETS...' : 'LOADING SIGNALS...'}
          </p>
        </div>
      ) : tabSignals.length === 0 ? (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'64px', border:'1px solid rgba(232,224,212,0.07)' }}>
          <Zap size={32} strokeWidth={1} style={{ color:'rgba(232,224,212,0.2)', marginBottom:'16px' }} />
          <div style={{ fontFamily:'"Playfair Display",serif', fontSize:'20px', fontWeight:700, color:'rgba(232,224,212,0.4)', marginBottom:'8px' }}>No signals found</div>
          <p style={{ fontSize:'13px', color:'rgba(232,224,212,0.3)', fontWeight:300 }}>Click Scan Now to analyze the market</p>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'16px' }}>
          {tabSignals.map(signal => <SignalCard key={signal.id} signal={signal} />)}
        </div>
      )}

      {/* Methodology */}
      <div style={{ marginTop:'40px', border:'1px solid rgba(232,224,212,0.07)', padding:'24px' }}>
        <div style={{ fontFamily:'"DM Mono",monospace', fontSize:'10px', letterSpacing:'0.1em', textTransform:'uppercase', color:'rgba(232,224,212,0.35)', marginBottom:'16px' }}>Signal Detection Methodology</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:'16px' }}>
          {[
            { title:'Momentum', items:['RSI reversals from oversold/overbought','MACD crossovers'] },
            { title:'Trend', items:['Moving average alignment (9/21 EMA)','Golden/Death cross context'] },
            { title:'Structure', items:['Support/Resistance levels','ATR-based stop placement'] },
            { title:'News', items:['AI sentiment analysis via Groq','Headline context scoring'] },
          ].map(s => (
            <div key={s.title}>
              <div style={{ fontFamily:'"DM Mono",monospace', fontSize:'10px', letterSpacing:'0.08em', color:'rgba(232,224,212,0.6)', marginBottom:'6px', textTransform:'uppercase' }}>{s.title}</div>
              {s.items.map(item => (
                <div key={item} style={{ fontSize:'12px', color:'rgba(232,224,212,0.4)', fontWeight:300, marginBottom:'3px' }}>— {item}</div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}