'use client'

import { useState } from 'react'
import {
  TrendingUp, TrendingDown, AlertTriangle, ChevronRight,
  Newspaper, Target, ShieldAlert, BarChart3, Clock,
} from 'lucide-react'
import type { TradeSignal } from '@/lib/types'

interface NewsItem {
  headline: string
  source: string
  url: string
  sentiment: string
  datetime: number
}

interface ExtendedSignal extends TradeSignal {
  news?: NewsItem[]
  newsBoost?: number
}

interface SignalCardProps {
  signal: ExtendedSignal
  onViewDetails?: (signal: TradeSignal) => void
}

const CSS = `
  .sc-card { background: #0f0f0f; border: 1px solid rgba(232,224,212,0.1); transition: border-color 0.2s; }
  .sc-card:hover { border-color: rgba(232,224,212,0.22); }
  .sc-trigger { display:inline-block;padding:3px 8px;border:1px solid rgba(232,224,212,0.12);font-family:"DM Mono",monospace;font-size:9px;letter-spacing:0.04em;color:rgba(232,224,212,0.5);margin:2px; }
  .sc-news-link { display:block;padding:8px 10px;border:1px solid rgba(232,224,212,0.06);transition:border-color 0.15s;text-decoration:none;margin-bottom:4px; }
  .sc-news-link:hover { border-color:rgba(232,224,212,0.15); }
  .sc-view-btn { width:100%;display:flex;align-items:center;justify-content:space-between;padding:10px 0;background:none;border:none;border-top:1px solid rgba(232,224,212,0.07);color:rgba(232,224,212,0.5);font-family:"DM Mono",monospace;font-size:10px;letter-spacing:0.06em;text-transform:uppercase;cursor:pointer;transition:color 0.15s;margin-top:8px; }
  .sc-view-btn:hover { color:#e8e0d4; }
  .modal-overlay { position:fixed;inset:0;background:rgba(0,0,0,0.8);display:flex;align-items:center;justify-content:center;z-index:100;padding:24px; }
  .modal { background:#0f0f0f;border:1px solid rgba(232,224,212,0.12);padding:32px;width:100%;max-width:480px;max-height:90vh;overflow-y:auto; }
  .modal-trigger { padding:10px 12px;border:1px solid rgba(232,224,212,0.1);margin-bottom:6px; }
  .modal-trigger.strong { border-color:rgba(126,200,160,0.2);background:rgba(126,200,160,0.04); }
  .modal-trigger.moderate { border-color:rgba(100,150,255,0.2);background:rgba(100,150,255,0.04); }
`

export function SignalCard({ signal, onViewDetails }: SignalCardProps) {
  const [showDetails, setShowDetails] = useState(false)
  const isBullish = signal.signalType === 'bullish_entry'
  const isWarning = signal.signalType === 'exit_warning'

  const entryPrice = signal.entry ?? signal.entryPrice ?? 0
  const targetPrice = signal.target ?? signal.targetPrice ?? 0
  const stopLoss = signal.stopLoss ?? 0
  const upsidePct = entryPrice > 0 ? ((targetPrice - entryPrice) / entryPrice * 100) : 0
  const downsidePct = entryPrice > 0 ? ((stopLoss - entryPrice) / entryPrice * 100) : 0

  const SignalIcon = isWarning ? AlertTriangle : isBullish ? TrendingUp : TrendingDown

  const sentimentColor = (s: string) => s === 'positive' ? '#7ec8a0' : s === 'negative' ? '#c87e7e' : 'rgba(232,224,212,0.5)'

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="sc-card" style={{ padding: '20px', fontFamily: '"DM Sans", sans-serif', color: '#e8e0d4', borderColor: isBullish ? 'rgba(126,200,160,0.3)' : isWarning ? 'rgba(255,200,100,0.3)' : 'rgba(200,126,126,0.3)' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: 36, height: 36, border: `1px solid ${isBullish ? 'rgba(126,200,160,0.25)' : 'rgba(200,126,126,0.25)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', background: isBullish ? 'rgba(126,200,160,0.06)' : 'rgba(200,126,126,0.06)' }}>
              <SignalIcon size={16} style={{ color: isBullish ? '#7ec8a0' : '#c87e7e' }} />
            </div>
            <div>
              <div style={{ fontFamily: '"Playfair Display", serif', fontSize: '18px', fontWeight: 700, color: '#e8e0d4', lineHeight: 1 }}>{signal.ticker}</div>
              <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '9px', letterSpacing: '0.06em', color: isBullish ? '#7ec8a0' : '#c87e7e', marginTop: '3px', textTransform: 'uppercase' }}>
                {isBullish ? '▲ Bullish Entry' : isWarning ? '⚠ Exit Warning' : '▼ Bearish Entry'}
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: '"Playfair Display", serif', fontSize: '24px', fontWeight: 700, color: signal.score >= 70 ? '#e8e0d4' : signal.score >= 50 ? 'rgba(232,224,212,0.7)' : 'rgba(232,224,212,0.4)', lineHeight: 1 }}>{signal.score}</div>
            <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '9px', color: 'rgba(232,224,212,0.35)', letterSpacing: '0.06em', marginTop: '3px' }}>{signal.confidence}</div>
          </div>
        </div>

        {/* Prices */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '6px', marginBottom: '12px' }}>
          <div style={{ background: 'rgba(232,224,212,0.03)', border: '1px solid rgba(232,224,212,0.07)', padding: '8px', textAlign: 'center' }}>
            <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '9px', color: 'rgba(232,224,212,0.35)', marginBottom: '4px', letterSpacing: '0.04em' }}>ENTRY</div>
            <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '12px', color: '#e8e0d4', fontWeight: 500 }}>${entryPrice.toFixed(2)}</div>
          </div>
          <div style={{ background: 'rgba(200,126,126,0.05)', border: '1px solid rgba(200,126,126,0.15)', padding: '8px', textAlign: 'center' }}>
            <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '9px', color: 'rgba(232,224,212,0.35)', marginBottom: '4px', letterSpacing: '0.04em' }}>STOP</div>
            <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '12px', color: '#c87e7e', fontWeight: 500 }}>${stopLoss.toFixed(2)}</div>
          </div>
          <div style={{ background: 'rgba(126,200,160,0.05)', border: '1px solid rgba(126,200,160,0.15)', padding: '8px', textAlign: 'center' }}>
            <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '9px', color: 'rgba(232,224,212,0.35)', marginBottom: '4px', letterSpacing: '0.04em' }}>TARGET</div>
            <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '12px', color: '#7ec8a0', fontWeight: 500 }}>${targetPrice.toFixed(2)}</div>
          </div>
        </div>

        {/* R/R */}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: 'rgba(232,224,212,0.02)', border: '1px solid rgba(232,224,212,0.07)', marginBottom: '12px' }}>
          <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '10px', color: 'rgba(232,224,212,0.4)', letterSpacing: '0.04em' }}>Risk/Reward</span>
          <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '10px', color: 'rgba(232,224,212,0.7)' }}>1:{(signal.riskReward ?? 0).toFixed(1)}</span>
        </div>

        {/* Triggers */}
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '9px', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(232,224,212,0.35)', marginBottom: '6px' }}>Triggers</div>
          <div>
            {signal.triggers.slice(0, 4).map((trigger, i) => (
              <span key={i} className="sc-trigger">{trigger.type.replace(/_/g, ' ')}</span>
            ))}
            {signal.triggers.length > 4 && (
              <span className="sc-trigger">+{signal.triggers.length - 4} more</span>
            )}
          </div>
        </div>

        {/* News */}
        {signal.news && signal.news.length > 0 && (
          <div style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontFamily: '"DM Mono", monospace', fontSize: '9px', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(232,224,212,0.35)' }}>
                <Newspaper size={10} /> Recent News
              </div>
              {signal.newsBoost !== undefined && signal.newsBoost !== 0 && (
                <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '9px', color: signal.newsBoost > 0 ? '#7ec8a0' : '#c87e7e', letterSpacing: '0.04em' }}>
                  {signal.newsBoost > 0 ? `+${signal.newsBoost}` : signal.newsBoost} pts
                </span>
              )}
            </div>
            {signal.news.map((item, i) => (
              <a key={i} href={item.url} target="_blank" rel="noopener noreferrer" className="sc-news-link">
                <div style={{ fontSize: '12px', color: sentimentColor(item.sentiment), lineHeight: 1.4 }}>
                  {item.headline.length > 80 ? item.headline.slice(0, 80) + '…' : item.headline}
                </div>
                <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '9px', color: 'rgba(232,224,212,0.3)', marginTop: '3px' }}>{item.source}</div>
              </a>
            ))}
          </div>
        )}

        <button className="sc-view-btn" onClick={() => setShowDetails(true)}>
          View Details <ChevronRight size={12} />
        </button>
      </div>

      {/* Modal */}
      {showDetails && (
        <div className="modal-overlay" onClick={() => setShowDetails(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            {/* Modal header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
              <div style={{ width: 32, height: 32, border: `1px solid ${isBullish ? 'rgba(126,200,160,0.25)' : 'rgba(200,126,126,0.25)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <SignalIcon size={14} style={{ color: isBullish ? '#7ec8a0' : '#c87e7e' }} />
              </div>
              <div>
                <div style={{ fontFamily: '"Playfair Display", serif', fontSize: '20px', fontWeight: 700, color: '#e8e0d4' }}>{signal.ticker}</div>
                <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '9px', color: isBullish ? '#7ec8a0' : '#c87e7e', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  {isBullish ? '▲ Bullish Entry' : '▼ Bearish Entry'}
                </div>
              </div>
              <button onClick={() => setShowDetails(false)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'rgba(232,224,212,0.4)', cursor: 'pointer', fontSize: '18px', padding: '4px' }}>×</button>
            </div>

            {/* Score */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', border: '1px solid rgba(232,224,212,0.08)', marginBottom: '20px', background: 'rgba(232,224,212,0.02)' }}>
              <div>
                <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '9px', color: 'rgba(232,224,212,0.4)', letterSpacing: '0.08em', marginBottom: '4px' }}>SIGNAL SCORE</div>
                <div style={{ fontFamily: '"Playfair Display", serif', fontSize: '28px', fontWeight: 700, color: '#e8e0d4' }}>{signal.score}<span style={{ fontSize: '14px', color: 'rgba(232,224,212,0.35)' }}>/100</span></div>
              </div>
              <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '10px', padding: '4px 10px', border: '1px solid rgba(232,224,212,0.2)', color: 'rgba(232,224,212,0.7)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                {signal.confidence} confidence
              </span>
            </div>

            {/* Trade setup */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '9px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(232,224,212,0.4)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <BarChart3 size={10} /> Trade Setup
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '6px', marginBottom: '8px' }}>
                <div style={{ padding: '12px', background: 'rgba(232,224,212,0.03)', border: '1px solid rgba(232,224,212,0.08)', textAlign: 'center' }}>
                  <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '9px', color: 'rgba(232,224,212,0.35)', marginBottom: '4px' }}>ENTRY</div>
                  <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '13px', fontWeight: 500 }}>${entryPrice.toFixed(2)}</div>
                </div>
                <div style={{ padding: '12px', background: 'rgba(200,126,126,0.06)', border: '1px solid rgba(200,126,126,0.2)', textAlign: 'center' }}>
                  <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '9px', color: 'rgba(232,224,212,0.35)', marginBottom: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}><ShieldAlert size={9} /> STOP</div>
                  <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '13px', color: '#c87e7e', fontWeight: 500 }}>${stopLoss.toFixed(2)}</div>
                  <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '10px', color: '#c87e7e', opacity: 0.7 }}>{downsidePct.toFixed(1)}%</div>
                </div>
                <div style={{ padding: '12px', background: 'rgba(126,200,160,0.06)', border: '1px solid rgba(126,200,160,0.2)', textAlign: 'center' }}>
                  <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '9px', color: 'rgba(232,224,212,0.35)', marginBottom: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}><Target size={9} /> TARGET</div>
                  <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '13px', color: '#7ec8a0', fontWeight: 500 }}>${targetPrice.toFixed(2)}</div>
                  <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '10px', color: '#7ec8a0', opacity: 0.7 }}>+{upsidePct.toFixed(1)}%</div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', border: '1px solid rgba(232,224,212,0.07)' }}>
                <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '10px', color: 'rgba(232,224,212,0.4)' }}>Risk/Reward Ratio</span>
                <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '10px', color: 'rgba(232,224,212,0.7)' }}>1:{(signal.riskReward ?? 0).toFixed(1)}</span>
              </div>
            </div>

            {/* Triggers */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '9px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(232,224,212,0.4)', marginBottom: '10px' }}>Why This Signal Fired</div>
              {signal.triggers.map((trigger, i) => (
                <div key={i} className={`modal-trigger ${trigger.strength}`}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '10px', color: trigger.strength === 'strong' ? '#7ec8a0' : trigger.strength === 'moderate' ? 'rgba(100,150,255,0.9)' : 'rgba(232,224,212,0.6)', letterSpacing: '0.04em', fontWeight: 500 }}>
                      {trigger.type.replace(/_/g, ' ')}
                    </span>
                    <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '9px', color: 'rgba(232,224,212,0.3)', letterSpacing: '0.04em' }}>{trigger.strength}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'rgba(232,224,212,0.5)', fontFamily: '"DM Sans", sans-serif', fontWeight: 300 }}>{trigger.description}</div>
                  {trigger.value !== undefined && (
                    <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '10px', color: 'rgba(232,224,212,0.3)', marginTop: '3px' }}>
                      Value: {typeof trigger.value === 'number' ? trigger.value.toFixed(2) : trigger.value}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* News */}
            {signal.news && signal.news.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '9px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(232,224,212,0.4)', marginBottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Newspaper size={10} /> Recent News</span>
                  {signal.newsBoost !== undefined && signal.newsBoost !== 0 && (
                    <span style={{ color: signal.newsBoost > 0 ? '#7ec8a0' : '#c87e7e' }}>
                      {signal.newsBoost > 0 ? `+${signal.newsBoost}` : signal.newsBoost} pts to score
                    </span>
                  )}
                </div>
                {signal.news.map((item, i) => (
                  <a key={i} href={item.url} target="_blank" rel="noopener noreferrer" className="sc-news-link">
                    <div style={{ fontSize: '13px', color: sentimentColor(item.sentiment), lineHeight: 1.5, fontFamily: '"DM Sans", sans-serif', fontWeight: 400 }}>{item.headline}</div>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                      <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '9px', color: 'rgba(232,224,212,0.3)' }}>{item.source}</span>
                      {item.datetime && (
                        <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '9px', color: 'rgba(232,224,212,0.3)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <Clock size={9} />{new Date(item.datetime * 1000).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </a>
                ))}
              </div>
            )}

            <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '9px', color: 'rgba(232,224,212,0.25)', textAlign: 'center', letterSpacing: '0.04em' }}>
              Signal generated at {new Date(signal.createdAt).toLocaleTimeString()}
            </div>
          </div>
        </div>
      )}
    </>
  )
}