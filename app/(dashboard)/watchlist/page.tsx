'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Spinner } from '@/components/ui/spinner'
import { Plus, Trash2, TrendingUp, TrendingDown, RefreshCw, Search, Zap, Activity } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Quote, DbWatchlist } from '@/lib/types'

const fetcher = (url: string) => fetch(url).then(r => r.json())

type SignalResult = {
  ticker: string; signalType?: string; score: number; confidence?: string
  triggers?: string[]; entryPrice?: number; stopLoss?: number; targetPrice?: number; riskReward?: number
}
type IndicatorResult = { rsi?: number; rsiTrend?: string; macdCrossover?: string }

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Mono:wght@300;400;500&family=DM+Sans:wght@300;400;500;600&display=swap');

  .wl-btn { display:flex;align-items:center;gap:6px;padding:8px 16px;background:transparent;border:1px solid rgba(232,224,212,0.18);color:rgba(232,224,212,0.65);font-family:"DM Mono",monospace;font-size:10px;letter-spacing:0.06em;text-transform:uppercase;cursor:pointer;transition:all 0.15s; }
  .wl-btn:hover { border-color:rgba(232,224,212,0.4);color:#e8e0d4; }
  .wl-btn:disabled { opacity:0.35;cursor:not-allowed; }
  .wl-btn.primary { background:#e8e0d4;color:#0a0a0a;border-color:#e8e0d4;font-weight:600; }
  .wl-btn.primary:hover { opacity:0.85; }
  .wl-input { width:100%;background:rgba(232,224,212,0.04);border:1px solid rgba(232,224,212,0.15);color:#e8e0d4;padding:10px 14px;font-family:"DM Sans",sans-serif;font-size:14px;outline:none;transition:border-color 0.2s; }
  .wl-input::placeholder { color:rgba(232,224,212,0.25); }
  .wl-input:focus { border-color:rgba(232,224,212,0.4); }
  .wl-table { width:100%;border-collapse:collapse; }
  .wl-table th { font-family:"DM Mono",monospace;font-size:9px;letter-spacing:0.1em;text-transform:uppercase;color:rgba(232,224,212,0.4);padding:10px 16px;text-align:left;border-bottom:1px solid rgba(232,224,212,0.08);font-weight:400; }
  .wl-table th.right { text-align:right; }
  .wl-table th.center { text-align:center; }
  .wl-table td { padding:14px 16px;border-bottom:1px solid rgba(232,224,212,0.05); }
  .wl-table tr:hover td { background:rgba(232,224,212,0.02); }
  .wl-table tr:last-child td { border-bottom:none; }
  .chip { display:inline-flex;align-items:center;gap:4px;padding:2px 8px;font-family:"DM Mono",monospace;font-size:10px;letter-spacing:0.04em;border:1px solid rgba(232,224,212,0.15);color:rgba(232,224,212,0.5); }
  .chip.bullish { border-color:rgba(126,200,160,0.35);color:#7ec8a0;background:rgba(126,200,160,0.06); }
  .chip.bearish { border-color:rgba(200,126,126,0.35);color:#c87e7e;background:rgba(200,126,126,0.06); }
  .quick-ticker { display:inline-block;padding:4px 10px;border:1px solid rgba(232,224,212,0.12);font-family:"DM Mono",monospace;font-size:10px;color:rgba(232,224,212,0.5);cursor:pointer;transition:all 0.15s;letter-spacing:0.04em; }
  .quick-ticker:hover { border-color:rgba(232,224,212,0.35);color:#e8e0d4; }
  .modal-overlay { position:fixed;inset:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:100;padding:16px; }
  .modal { background:#0f0f0f;border:1px solid rgba(232,224,212,0.12);padding:32px;width:100%;max-width:380px; }

  .wl-header { display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:32px;gap:16px; }
  .wl-actions { display:flex;gap:8px;flex-wrap:wrap; }

  @media (max-width: 768px) {
    .wl-page { padding: 16px !important; }
    .wl-header { flex-direction: column; }
    .wl-actions { width: 100%; }
    .wl-actions .wl-btn { flex: 1; justify-content: center; font-size: 9px; padding: 7px 8px; }
    .wl-table th, .wl-table td { padding: 10px 8px; }
    .wl-table th:nth-child(4),
    .wl-table td:nth-child(4) { display: none; }
    .wl-table th:nth-child(7),
    .wl-table td:nth-child(7) { display: none; }
  }
`

export default function WatchlistPage() {
  const [newTicker, setNewTicker] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [signals, setSignals] = useState<Map<string, SignalResult>>(new Map())
  const [indicators, setIndicators] = useState<Map<string, IndicatorResult>>(new Map())
  const supabase = createClient()

  const { data: watchlistData, isLoading: watchlistLoading, mutate: refreshWatchlist } = useSWR<DbWatchlist[]>(
    'watchlist',
    async () => {
      const { data, error } = await supabase.from('watchlists').select('*').order('added_at', { ascending: false })
      if (error) throw error
      return data || []
    }
  )

  const watchlist = watchlistData || []
  const tickers = watchlist.map(w => w.ticker)

  const { data: quotesData, isLoading: quotesLoading, mutate: refreshQuotes } = useSWR(
    tickers.length > 0 ? `/api/market/quotes?tickers=${tickers.join(',')}` : null,
    fetcher,
    { refreshInterval: 30000 }
  )

  const quotes: Quote[] = quotesData?.quotes || []
  const quotesMap = new Map(quotes.map(q => [q.ticker, q]))

  const handleScanWatchlist = async () => {
    if (tickers.length === 0) return
    setIsScanning(true)
    try {
      const res = await fetch(`/api/signals/scan?tickers=${tickers.join(',')}&minScore=0`)
      const data = await res.json()
      const newSignals = new Map<string, SignalResult>()
      data.signals?.forEach((s: SignalResult) => newSignals.set(s.ticker, s))
      tickers.forEach(ticker => { if (!newSignals.has(ticker)) newSignals.set(ticker, { ticker, score: 0 }) })
      setSignals(newSignals)
      const indicatorResults = await Promise.allSettled(
        tickers.map(async (ticker) => {
          const res = await fetch(`/api/market/indicators?ticker=${ticker}`)
          if (!res.ok) return [ticker, null]
          const data = await res.json()
          return [ticker, data]
        })
      )
      const newIndicators = new Map<string, IndicatorResult>()
      indicatorResults.forEach((result) => {
        if (result.status === 'fulfilled' && result.value[1])
          newIndicators.set(result.value[0] as string, result.value[1] as IndicatorResult)
      })
      setIndicators(newIndicators)
    } finally { setIsScanning(false) }
  }

  const handleAddTicker = async () => {
    if (!newTicker.trim()) return
    setIsAdding(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { error } = await supabase.from('watchlists').insert({ user_id: user.id, ticker: newTicker.toUpperCase().trim() })
      if (error) { if (error.code === '23505') alert('Already in watchlist') }
      else { setNewTicker(''); setIsDialogOpen(false); refreshWatchlist() }
    } finally { setIsAdding(false) }
  }

  const handleRemoveTicker = async (id: string) => {
    const { error } = await supabase.from('watchlists').delete().eq('id', id)
    if (!error) refreshWatchlist()
  }

  const addQuickTicker = async (ticker: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('watchlists').insert({ user_id: user.id, ticker })
    refreshWatchlist()
  }

  return (
    <div className="wl-page" style={{ padding:'32px 40px', fontFamily:'"DM Sans",sans-serif', color:'#e8e0d4', minHeight:'100vh', background:'#0a0a0a' }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* Header */}
      <div className="wl-header">
        <div>
          <div style={{ fontFamily:'"DM Mono",monospace', fontSize:'10px', letterSpacing:'0.1em', textTransform:'uppercase', color:'rgba(232,224,212,0.4)', marginBottom:'8px' }}>Portfolio</div>
          <h1 style={{ fontFamily:'"Playfair Display",serif', fontSize:'32px', fontWeight:900, letterSpacing:'-0.02em', color:'#e8e0d4', lineHeight:1 }}>Watchlist</h1>
          <p style={{ fontSize:'14px', color:'rgba(232,224,212,0.45)', marginTop:'6px', fontWeight:300 }}>Track your favorite stocks and monitor for signals</p>
        </div>
        <div className="wl-actions">
          <button className="wl-btn" onClick={() => refreshQuotes()}><RefreshCw size={11} /> Refresh</button>
          <button className="wl-btn" onClick={handleScanWatchlist} disabled={isScanning || tickers.length === 0}>
            {isScanning ? <Spinner className="h-3 w-3" /> : <Activity size={11} />}
            {isScanning ? 'Scanning...' : 'Scan'}
          </button>
          <button className="wl-btn primary" onClick={() => setIsDialogOpen(true)}><Plus size={11} /> Add</button>
        </div>
      </div>

      {/* Table */}
      <div style={{ border:'1px solid rgba(232,224,212,0.08)', marginBottom:'24px' }}>
        <div style={{ padding:'16px 20px', borderBottom:'1px solid rgba(232,224,212,0.07)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontFamily:'"DM Mono",monospace', fontSize:'11px', color:'rgba(232,224,212,0.6)', letterSpacing:'0.06em' }}>
            {watchlist.length} {watchlist.length === 1 ? 'stock' : 'stocks'} tracked
            {signals.size > 0 && ` · ${[...signals.values()].filter(s => s.signalType).length} signals`}
          </span>
          {signals.size === 0 && tickers.length > 0 && (
            <span style={{ fontFamily:'"DM Mono",monospace', fontSize:'10px', color:'rgba(232,224,212,0.3)', display:'flex', alignItems:'center', gap:'4px' }}>
              <Zap size={10} /> Scan to see signals
            </span>
          )}
        </div>

        {watchlistLoading ? (
          <div style={{ display:'flex', justifyContent:'center', padding:'48px' }}><Spinner className="h-6 w-6" /></div>
        ) : watchlist.length === 0 ? (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'64px', textAlign:'center' }}>
            <Search size={32} strokeWidth={1} style={{ color:'rgba(232,224,212,0.2)', marginBottom:'16px' }} />
            <div style={{ fontFamily:'"Playfair Display",serif', fontSize:'20px', fontWeight:700, color:'rgba(232,224,212,0.5)', marginBottom:'8px' }}>No stocks tracked</div>
            <p style={{ fontSize:'13px', color:'rgba(232,224,212,0.3)', marginBottom:'24px', fontWeight:300 }}>Add tickers to start tracking them</p>
            <button className="wl-btn primary" onClick={() => setIsDialogOpen(true)}><Plus size={11} /> Add Your First Stock</button>
          </div>
        ) : (
          <div style={{ overflowX:'auto', WebkitOverflowScrolling:'touch' } as React.CSSProperties}>
            <table className="wl-table" style={{ minWidth:'600px' }}>
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th className="right">Price</th>
                  <th className="right">Change</th>
                  <th className="right">Volume</th>
                  <th className="right">RSI</th>
                  <th className="center">Signal</th>
                  <th className="right">Target / Stop</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {watchlist.map((item) => {
                  const quote = quotesMap.get(item.ticker)
                  const isPositive = quote ? quote.change >= 0 : true
                  const signal = signals.get(item.ticker)
                  const ind = indicators.get(item.ticker)
                  const rsi = ind?.rsi
                  return (
                    <tr key={item.id}>
                      <td style={{ fontFamily:'"DM Mono",monospace', fontSize:'14px', fontWeight:500, color:'#e8e0d4' }}>{item.ticker}</td>
                      <td style={{ textAlign:'right', fontFamily:'"DM Mono",monospace', fontSize:'13px' }}>
                        {quotesLoading ? <Spinner className="ml-auto h-3 w-3" /> : quote ? `$${quote.price.toFixed(2)}` : '—'}
                      </td>
                      <td style={{ textAlign:'right' }}>
                        {quote && (
                          <span style={{ display:'flex', alignItems:'center', justifyContent:'flex-end', gap:'4px', fontFamily:'"DM Mono",monospace', fontSize:'12px', color: isPositive ? '#7ec8a0' : '#c87e7e' }}>
                            {isPositive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                            {isPositive ? '+' : ''}{quote.changePercent.toFixed(2)}%
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign:'right', fontFamily:'"DM Mono",monospace', fontSize:'12px', color:'rgba(232,224,212,0.4)' }}>
                        {quote ? `${(quote.volume / 1000000).toFixed(1)}M` : '—'}
                      </td>
                      <td style={{ textAlign:'right' }}>
                        {rsi ? (
                          <div>
                            <div style={{ fontFamily:'"DM Mono",monospace', fontSize:'13px', color: rsi < 30 ? '#7ec8a0' : rsi > 70 ? '#c87e7e' : 'rgba(232,224,212,0.7)', textAlign:'right' }}>{rsi.toFixed(0)}</div>
                            <div style={{ fontFamily:'"DM Mono",monospace', fontSize:'9px', color: rsi < 30 ? '#7ec8a0' : rsi > 70 ? '#c87e7e' : 'rgba(232,224,212,0.35)', textAlign:'right' }}>
                              {rsi < 30 ? 'Oversold' : rsi > 70 ? 'Overbought' : 'Neutral'}
                            </div>
                          </div>
                        ) : <span style={{ color:'rgba(232,224,212,0.25)', fontFamily:'"DM Mono",monospace', fontSize:'12px' }}>—</span>}
                      </td>
                      <td style={{ textAlign:'center' }}>
                        {isScanning ? <Spinner className="h-3 w-3 mx-auto" /> :
                          signal?.signalType ? (
                            <span className={`chip ${signal.signalType === 'bullish_entry' ? 'bullish' : 'bearish'}`}>
                              {signal.signalType === 'bullish_entry' ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
                              {signal.signalType === 'bullish_entry' ? 'BULL' : 'BEAR'}
                              {signal.score > 0 && <span style={{ opacity:0.6 }}>·{signal.score}</span>}
                            </span>
                          ) : signals.size > 0 ? <span className="chip">NEUTRAL</span> : null}
                      </td>
                      <td style={{ textAlign:'right' }}>
                        {isScanning ? <Spinner className="h-3 w-3 ml-auto" /> :
                          signal?.targetPrice && signal?.stopLoss && quote ? (
                            <div style={{ fontFamily:'"DM Mono",monospace', fontSize:'11px' }}>
                              <div style={{ color:'#7ec8a0' }}>T ${signal.targetPrice.toFixed(2)}</div>
                              <div style={{ color:'#c87e7e' }}>S ${signal.stopLoss.toFixed(2)}</div>
                              {signal.riskReward && <div style={{ color:'rgba(232,224,212,0.35)' }}>R:R 1:{signal.riskReward.toFixed(1)}</div>}
                            </div>
                          ) : signals.size > 0 ? <span style={{ fontFamily:'"DM Mono",monospace', fontSize:'11px', color:'rgba(232,224,212,0.25)' }}>No setup</span> : null}
                      </td>
                      <td>
                        <button onClick={() => handleRemoveTicker(item.id)} style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(232,224,212,0.25)', padding:'4px', transition:'color 0.15s' }}
                          onMouseEnter={e => (e.currentTarget.style.color = '#c87e7e')}
                          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(232,224,212,0.25)')}>
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick add */}
      {watchlist.length < 10 && (
        <div style={{ border:'1px solid rgba(232,224,212,0.07)', padding:'20px 24px' }}>
          <div style={{ fontFamily:'"DM Mono",monospace', fontSize:'10px', letterSpacing:'0.1em', textTransform:'uppercase', color:'rgba(232,224,212,0.4)', marginBottom:'12px' }}>Popular Stocks</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:'6px' }}>
            {['AAPL','MSFT','GOOGL','AMZN','NVDA','META','TSLA','AMD','SPY','QQQ']
              .filter(t => !tickers.includes(t))
              .map(ticker => (
                <span key={ticker} className="quick-ticker" onClick={() => addQuickTicker(ticker)}>+ {ticker}</span>
              ))}
          </div>
        </div>
      )}

      {/* Modal */}
      {isDialogOpen && (
        <div className="modal-overlay" onClick={() => setIsDialogOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ fontFamily:'"DM Mono",monospace', fontSize:'10px', letterSpacing:'0.1em', textTransform:'uppercase', color:'rgba(232,224,212,0.4)', marginBottom:'12px' }}>Add to Watchlist</div>
            <h2 style={{ fontFamily:'"Playfair Display",serif', fontSize:'24px', fontWeight:900, color:'#e8e0d4', marginBottom:'24px' }}>Enter ticker symbol.</h2>
            <input className="wl-input" placeholder="e.g. AAPL, TSLA, NVDA" value={newTicker}
              onChange={e => setNewTicker(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && handleAddTicker()}
              autoFocus style={{ marginBottom:'16px' }} />
            <div style={{ display:'flex', gap:'8px', justifyContent:'flex-end' }}>
              <button className="wl-btn" onClick={() => setIsDialogOpen(false)}>Cancel</button>
              <button className="wl-btn primary" onClick={handleAddTicker} disabled={isAdding || !newTicker.trim()}>
                {isAdding ? <Spinner className="h-3 w-3" /> : null} Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}