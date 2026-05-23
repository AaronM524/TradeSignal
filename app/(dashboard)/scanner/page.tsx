'use client'

import { useState } from 'react'
import { Spinner } from '@/components/ui/spinner'
import { Slider } from '@/components/ui/slider'
import { Search, TrendingUp, TrendingDown, BarChart3, ChevronDown, ChevronUp } from 'lucide-react'
import type { Quote, TechnicalIndicators } from '@/lib/types'

const DEFAULT_TICKERS = [
  'AAPL','MSFT','NVDA','TSLA','AMD','META','GOOGL','AMZN',
  'SPY','QQQ','PLTR','SOFI','COIN','JPM','V','NFLX','CRM','AVGO','HOOD','MSTR',
]

const SECTOR_TICKERS: Record<string, string[]> = {
  'Tech Giants': ['AAPL','MSFT','GOOGL','AMZN','META','NVDA'],
  'Semiconductors': ['AMD','INTC','QCOM','AVGO','MU','AMAT','TXN'],
  'Finance': ['JPM','GS','MS','BAC','V','MA','PYPL'],
  'ETFs': ['SPY','QQQ','IWM','DIA','ARKK'],
  'EV/Auto': ['TSLA','RIVN','NIO','XPEV','F','GM'],
  'Retail Favorites': ['PLTR','SOFI','COIN','RBLX','HOOD'],
}

interface ScanResult { ticker: string; quote: Quote; indicators: TechnicalIndicators }

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Mono:wght@300;400;500&family=DM+Sans:wght@300;400;500;600&display=swap');
  .sc-btn { display:flex;align-items:center;gap:6px;padding:8px 16px;background:transparent;border:1px solid rgba(232,224,212,0.18);color:rgba(232,224,212,0.65);font-family:"DM Mono",monospace;font-size:10px;letter-spacing:0.06em;text-transform:uppercase;cursor:pointer;transition:all 0.15s; }
  .sc-btn:hover { border-color:rgba(232,224,212,0.4);color:#e8e0d4; }
  .sc-btn:disabled { opacity:0.35;cursor:not-allowed; }
  .sc-btn.primary { background:#e8e0d4;color:#0a0a0a;border-color:#e8e0d4;font-weight:600; }
  .sc-btn.primary:hover { opacity:0.85; }
  .sc-input { width:100%;background:rgba(232,224,212,0.04);border:1px solid rgba(232,224,212,0.15);color:#e8e0d4;padding:10px 14px;font-family:"DM Sans",sans-serif;font-size:13px;outline:none;transition:border-color 0.2s; }
  .sc-input::placeholder { color:rgba(232,224,212,0.25); }
  .sc-input:focus { border-color:rgba(232,224,212,0.4); }
  .sc-label { font-family:"DM Mono",monospace;font-size:9px;letter-spacing:0.1em;text-transform:uppercase;color:rgba(232,224,212,0.45);margin-bottom:8px;display:block; }
  .sc-tag { display:inline-block;padding:3px 9px;border:1px solid rgba(232,224,212,0.12);font-family:"DM Mono",monospace;font-size:10px;color:rgba(232,224,212,0.5);cursor:pointer;transition:all 0.15s;letter-spacing:0.03em; }
  .sc-tag:hover { border-color:rgba(232,224,212,0.35);color:#e8e0d4; }
  .sc-switch { width:36px;height:20px;border-radius:10px;border:1px solid rgba(232,224,212,0.2);background:rgba(232,224,212,0.05);cursor:pointer;position:relative;transition:all 0.2s;flex-shrink:0; }
  .sc-switch.on { background:rgba(232,224,212,0.2);border-color:rgba(232,224,212,0.4); }
  .sc-switch-knob { width:14px;height:14px;border-radius:50%;background:#e8e0d4;position:absolute;top:2px;left:2px;transition:transform 0.2s; }
  .sc-switch.on .sc-switch-knob { transform:translateX(16px); }
  .sc-table { width:100%;border-collapse:collapse; }
  .sc-table th { font-family:"DM Mono",monospace;font-size:9px;letter-spacing:0.1em;text-transform:uppercase;color:rgba(232,224,212,0.4);padding:10px 16px;text-align:left;border-bottom:1px solid rgba(232,224,212,0.08);font-weight:400; }
  .sc-table th.r { text-align:right; }
  .sc-table td { padding:12px 16px;border-bottom:1px solid rgba(232,224,212,0.05);font-family:"DM Mono",monospace;font-size:12px; }
  .sc-table tr:hover td { background:rgba(232,224,212,0.02); }
  .sc-table tr:last-child td { border-bottom:none; }
  .sc-chip { display:inline-flex;align-items:center;gap:3px;padding:2px 7px;border:1px solid rgba(232,224,212,0.15);font-family:"DM Mono",monospace;font-size:10px;color:rgba(232,224,212,0.5); }
  .sc-progress-bar { height:2px;background:rgba(232,224,212,0.08);border-radius:2px;overflow:hidden;margin-top:12px; }
  .sc-progress-fill { height:100%;background:#e8e0d4;border-radius:2px;transition:width 0.4s ease; }
`

export default function ScannerPage() {
  const [customTickers, setCustomTickers] = useState('')
  const [minRSI, setMinRSI] = useState([20])
  const [maxRSI, setMaxRSI] = useState([80])
  const [bullishMACD, setBullishMACD] = useState(false)
  const [bullishEMA, setBullishEMA] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [results, setResults] = useState<ScanResult[]>([])
  const [scannedCount, setScannedCount] = useState(0)
  const [totalTickers, setTotalTickers] = useState(0)
  const [showAllTickers, setShowAllTickers] = useState(false)

  const handleScan = async () => {
    setIsScanning(true); setResults([]); setScannedCount(0)
    const tickers = customTickers.trim() ? customTickers.split(',').map(t => t.trim().toUpperCase()).filter(Boolean) : DEFAULT_TICKERS
    setTotalTickers(tickers.length)
    try {
      const scanResults: ScanResult[] = []
      for (const ticker of tickers) {
        try {
          const [qr, ir] = await Promise.all([fetch(`/api/market/quote?ticker=${ticker}`), fetch(`/api/market/indicators?ticker=${ticker}`)])
          if (!qr.ok || !ir.ok) continue
          const quote: Quote = await qr.json()
          const indicators: TechnicalIndicators = await ir.json()
          if (!quote || !indicators) continue
          if (indicators.rsi < minRSI[0] || indicators.rsi > maxRSI[0]) continue
          if (bullishMACD && indicators.macdCrossover !== 'bullish') continue
          if (bullishEMA && !(quote.price > indicators.ema9 && indicators.ema9 > indicators.ema21)) continue
          scanResults.push({ ticker, quote, indicators })
          setScannedCount(c => c + 1)
        } catch {}
        await new Promise(r => setTimeout(r, 800))
      }
      setResults(scanResults)
    } finally { setIsScanning(false) }
  }

  const addSectorTickers = (tickers: string[]) => {
    const current = customTickers.trim() ? customTickers.split(',').map(t => t.trim().toUpperCase()) : []
    setCustomTickers([...new Set([...current, ...tickers])].join(', '))
  }

  const addTicker = (ticker: string) => {
    const current = customTickers.trim() ? customTickers.split(',').map(t => t.trim().toUpperCase()) : []
    if (!current.includes(ticker)) setCustomTickers([...current, ticker].join(', '))
  }

  return (
    <div style={{ padding:'32px 40px', fontFamily:'"DM Sans",sans-serif', color:'#e8e0d4', minHeight:'100vh', background:'#0a0a0a' }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* Page header */}
      <div style={{ marginBottom:'28px' }}>
        <div style={{ fontFamily:'"DM Mono",monospace', fontSize:'10px', letterSpacing:'0.1em', textTransform:'uppercase', color:'rgba(232,224,212,0.4)', marginBottom:'8px' }}>Market</div>
        <h1 style={{ fontFamily:'"Playfair Display",serif', fontSize:'32px', fontWeight:900, letterSpacing:'-0.02em', color:'#e8e0d4', lineHeight:1 }}>Stock Scanner</h1>
        <p style={{ fontSize:'14px', color:'rgba(232,224,212,0.45)', marginTop:'6px', fontWeight:300 }}>Scan any stock with custom technical filters</p>
      </div>

      {/* Filter bar — horizontal */}
      <div style={{ border:'1px solid rgba(232,224,212,0.08)', padding:'20px 24px', marginBottom:'16px' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 200px 160px auto auto auto', gap:'20px', alignItems:'end', marginBottom:'16px' }}>
          <div>
            <label className="sc-label">Tickers (comma separated)</label>
            <input className="sc-input" placeholder="AAPL, MSFT... (empty = top 20 stocks)" value={customTickers} onChange={e => setCustomTickers(e.target.value.toUpperCase())} />
          </div>
          <div>
            <label className="sc-label">RSI Range: {minRSI[0]} — {maxRSI[0]}</label>
            <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
              <Slider value={minRSI} onValueChange={setMinRSI} max={100} step={5} />
              <Slider value={maxRSI} onValueChange={setMaxRSI} max={100} step={5} />
            </div>
          </div>
          <div>
            <label className="sc-label">RSI Presets</label>
            <div style={{ display:'flex', gap:'4px' }}>
              {[['OS',[0,35]],['OB',[65,100]],['↺',[20,80]]].map(([l,v]) => (
                <span key={l as string} className="sc-tag" onClick={() => { setMinRSI([(v as number[])[0]]); setMaxRSI([(v as number[])[1]]) }}>{l as string}</span>
              ))}
            </div>
          </div>
          <div>
            <label className="sc-label">Bullish MACD</label>
            <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
              <div className={`sc-switch ${bullishMACD ? 'on' : ''}`} onClick={() => setBullishMACD(!bullishMACD)}>
                <div className="sc-switch-knob" />
              </div>
              <span style={{ fontSize:'11px', color:'rgba(232,224,212,0.55)', fontFamily:'"DM Mono",monospace' }}>{bullishMACD ? 'ON' : 'OFF'}</span>
            </div>
          </div>
          <div>
            <label className="sc-label">Bullish EMA</label>
            <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
              <div className={`sc-switch ${bullishEMA ? 'on' : ''}`} onClick={() => setBullishEMA(!bullishEMA)}>
                <div className="sc-switch-knob" />
              </div>
              <span style={{ fontSize:'11px', color:'rgba(232,224,212,0.55)', fontFamily:'"DM Mono",monospace' }}>{bullishEMA ? 'ON' : 'OFF'}</span>
            </div>
          </div>
          <button className="sc-btn primary" onClick={handleScan} disabled={isScanning} style={{ justifyContent:'center', whiteSpace:'nowrap', height:'40px' }}>
            {isScanning ? <Spinner className="h-3 w-3" /> : <Search size={11} />}
            {isScanning ? `${scannedCount} done` : 'Run Scan'}
          </button>
        </div>

        {/* Sectors + Quick scans in one row */}
        <div style={{ display:'flex', alignItems:'center', gap:'6px', flexWrap:'wrap', paddingTop:'14px', borderTop:'1px solid rgba(232,224,212,0.06)' }}>
          <span style={{ fontFamily:'"DM Mono",monospace', fontSize:'9px', color:'rgba(232,224,212,0.3)', letterSpacing:'0.08em', marginRight:'4px' }}>SECTORS:</span>
          {Object.entries(SECTOR_TICKERS).map(([sector, tickers]) => (
            <span key={sector} className="sc-tag" onClick={() => addSectorTickers(tickers)}>+ {sector}</span>
          ))}
          <span style={{ fontFamily:'"DM Mono",monospace', fontSize:'9px', color:'rgba(232,224,212,0.3)', letterSpacing:'0.08em', marginLeft:'8px', marginRight:'4px' }}>QUICK:</span>
          {[
            ['Oversold', () => { setMinRSI([0]); setMaxRSI([35]); setBullishMACD(false); setBullishEMA(false) }],
            ['Momentum', () => { setMinRSI([40]); setMaxRSI([65]); setBullishMACD(true); setBullishEMA(true) }],
            ['Overbought', () => { setMinRSI([65]); setMaxRSI([100]); setBullishMACD(false); setBullishEMA(false) }],
            ['MACD+EMA', () => { setMinRSI([45]); setMaxRSI([55]); setBullishMACD(true); setBullishEMA(true) }],
          ].map(([label, action]) => (
            <span key={label as string} className="sc-tag" onClick={action as () => void}>{label as string}</span>
          ))}
        </div>
      </div>

      {/* Results */}
      <div style={{ border:'1px solid rgba(232,224,212,0.08)', marginBottom:'16px' }}>
        <div style={{ padding:'14px 20px', borderBottom:'1px solid rgba(232,224,212,0.07)' }}>
          <span style={{ fontFamily:'"DM Mono",monospace', fontSize:'11px', color:'rgba(232,224,212,0.55)', letterSpacing:'0.06em' }}>
            {isScanning ? `Scanning... ${scannedCount} processed` : `${results.length} stocks match your criteria`}
          </span>
        </div>

        {isScanning ? (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'48px 64px' }}>
            <Spinner className="h-8 w-8" />
            <p style={{ fontFamily:'"DM Mono",monospace', fontSize:'11px', color:'rgba(232,224,212,0.5)', marginTop:'16px', letterSpacing:'0.06em' }}>
              SCANNING {scannedCount} / {totalTickers}
            </p>
            <div style={{ width:'240px', marginTop:'12px' }}>
              <div className="sc-progress-bar">
                <div className="sc-progress-fill" style={{ width: totalTickers > 0 ? `${(scannedCount / totalTickers) * 100}%` : '0%' }} />
              </div>
            </div>
            <p style={{ fontFamily:'"DM Mono",monospace', fontSize:'10px', color:'rgba(232,224,212,0.25)', marginTop:'8px', letterSpacing:'0.04em' }}>
              ~{Math.ceil((totalTickers - scannedCount) * 0.8)}s remaining
            </p>
          </div>
        ) : results.length === 0 ? (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'64px' }}>
            <BarChart3 size={32} strokeWidth={1} style={{ color:'rgba(232,224,212,0.2)', marginBottom:'16px' }} />
            <div style={{ fontFamily:'"Playfair Display",serif', fontSize:'20px', fontWeight:700, color:'rgba(232,224,212,0.4)', marginBottom:'8px' }}>No results yet</div>
            <p style={{ fontSize:'13px', color:'rgba(232,224,212,0.3)', fontWeight:300 }}>Configure your filters and click Run Scan</p>
          </div>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table className="sc-table">
              <thead>
                <tr>
                  <th>Ticker</th>
                  <th className="r">Price</th>
                  <th className="r">Change</th>
                  <th className="r">RSI</th>
                  <th className="r">MACD</th>
                  <th className="r">EMA</th>
                </tr>
              </thead>
              <tbody>
                {results.map(({ ticker, quote, indicators }) => {
                  const pos = quote.change >= 0
                  const bullStack = quote.price > indicators.ema9 && indicators.ema9 > indicators.ema21
                  return (
                    <tr key={ticker}>
                      <td style={{ color:'#e8e0d4', fontWeight:500 }}>{ticker}</td>
                      <td style={{ textAlign:'right' }}>${quote.price.toFixed(2)}</td>
                      <td style={{ textAlign:'right', color: pos ? '#7ec8a0' : '#c87e7e' }}>
                        <span style={{ display:'flex', alignItems:'center', justifyContent:'flex-end', gap:'3px' }}>
                          {pos ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                          {pos ? '+' : ''}{quote.changePercent.toFixed(2)}%
                        </span>
                      </td>
                      <td style={{ textAlign:'right', color: indicators.rsi <= 35 ? '#7ec8a0' : indicators.rsi >= 65 ? '#c87e7e' : 'rgba(232,224,212,0.7)' }}>
                        {indicators.rsi.toFixed(1)}
                      </td>
                      <td style={{ textAlign:'right' }}>
                        <span className={`sc-chip ${indicators.macdCrossover === 'bullish' ? 'bull' : indicators.macdCrossover === 'bearish' ? 'bear' : ''}`}>
                          {indicators.macdCrossover === 'bullish' ? '▲ Bull Cross' : indicators.macdCrossover === 'bearish' ? '▼ Bear Cross' : indicators.macd > indicators.macdSignal ? 'Bull' : 'Bear'}
                        </span>
                      </td>
                      <td style={{ textAlign:'right' }}>
                        <span className={`sc-chip ${bullStack ? 'bull' : 'bear'}`}>{bullStack ? '▲ Bullish' : '▼ Bearish'}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Default universe expandable */}
      <div style={{ border:'1px solid rgba(232,224,212,0.07)', padding:'16px 24px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: showAllTickers ? '14px' : '0' }}>
          <span style={{ fontFamily:'"DM Mono",monospace', fontSize:'10px', letterSpacing:'0.1em', textTransform:'uppercase', color:'rgba(232,224,212,0.4)' }}>
            Default Universe ({DEFAULT_TICKERS.length} stocks — fastest scan)
          </span>
          <button className="sc-btn" onClick={() => setShowAllTickers(!showAllTickers)} style={{ padding:'4px 10px' }}>
            {showAllTickers ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            {showAllTickers ? 'Hide' : 'Show All'}
          </button>
        </div>
        {showAllTickers && (
          <div style={{ display:'flex', flexWrap:'wrap', gap:'4px' }}>
            {DEFAULT_TICKERS.map(ticker => (
              <span key={ticker} className="sc-tag" onClick={() => addTicker(ticker)}>{ticker}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}