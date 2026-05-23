'use client'

import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'

const signals = [
  { ticker: 'NVDA', dir: 'SHORT', score: 58, rsi: 66.7, macd: 'Bear Cross', entry: '219.51', stop: '236.19', target: '186.14' },
  { ticker: 'MSFT', dir: 'LONG', score: 45, rsi: 54.0, macd: 'Bullish', entry: '419.09', stop: '397.07', target: '463.12' },
  { ticker: 'AMD', dir: 'SHORT', score: 43, rsi: 70.2, macd: 'Bear', entry: '448.56', stop: '502.97', target: '339.73' },
]

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700&family=DM+Mono:wght@300;400;500&family=Inter:wght@300;400;500&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  .mono { font-family: "DM Mono", monospace; }
  .sans { font-family: "Inter", system-ui, sans-serif; }
  .nav-link { font-family: "Inter", sans-serif; font-size: 12px; font-weight: 500; letter-spacing: 0.06em; text-transform: uppercase; color: rgba(232,224,212,0.6); text-decoration: none; transition: color 0.2s; }
  .nav-link:hover { color: #e8e0d4; }
  .btn-dark { background: #e8e0d4; color: #0a0a0a; border: none; padding: 12px 28px; font-family: "Inter", sans-serif; font-size: 12px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; cursor: pointer; transition: opacity 0.15s; }
  .btn-dark:hover { opacity: 0.85; }
  .btn-outline { background: transparent; color: rgba(232,224,212,0.75); border: 1px solid rgba(232,224,212,0.35); padding: 11px 28px; font-family: "Inter", sans-serif; font-size: 12px; font-weight: 500; letter-spacing: 0.06em; text-transform: uppercase; cursor: pointer; transition: all 0.15s; }
  .btn-outline:hover { border-color: rgba(232,224,212,0.65); color: #e8e0d4; }
  .signal-row { display: grid; grid-template-columns: 100px 1fr auto; align-items: center; padding: 20px 0; border-bottom: 1px solid rgba(232,224,212,0.1); gap: 24px; cursor: pointer; transition: background 0.15s; }
  .signal-row:hover { background: rgba(232,224,212,0.04); margin: 0 -24px; padding: 20px 24px; }
  .divider { width: 40px; height: 1px; background: rgba(232,224,212,0.5); margin-bottom: 24px; }
  .feature-card { padding: 36px; border: 1px solid rgba(232,224,212,0.15); background: #0a0a0a; transition: all 0.2s; }
  .feature-card:hover { background: rgba(232,224,212,0.03); border-color: rgba(232,224,212,0.35); }
  .feat-label { font-family: "Inter", sans-serif; font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; color: rgba(232,224,212,0.45); margin-bottom: 12px; }
  .feat-title { font-size: 18px; font-weight: 700; margin-bottom: 12px; line-height: 1.2; color: #e8e0d4; }
  .feat-desc { font-family: "Inter", sans-serif; font-size: 13px; line-height: 1.65; color: rgba(232,224,212,0.6); font-weight: 300; }
  .big-number { font-family: "Playfair Display", serif; font-size: 52px; font-weight: 900; line-height: 1; letter-spacing: -0.04em; color: #e8e0d4; }
  @media (max-width: 768px) {
    .hero-grid { grid-template-columns: 1fr !important; }
    .feature-grid { grid-template-columns: 1fr !important; }
    .stat-grid { grid-template-columns: repeat(2,1fr) !important; }
  }
`

export default function LandingPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#e8e0d4', fontFamily: '"Playfair Display", Georgia, serif', overflowX: 'hidden' }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* Top ticker bar */}
      <div style={{ background: '#050505', padding: '8px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(232,224,212,0.06)' }}>
        <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '11px', color: 'rgba(232,224,212,0.6)', letterSpacing: '0.06em' }}>
          SPY <span style={{ color: '#7ec8a0' }}>+0.82%</span>
          {' · '}QQQ <span style={{ color: '#7ec8a0' }}>+1.04%</span>
          {' · '}VIX <span style={{ color: '#c87e7e' }}>18.3</span>
          {' · '}NYSE OPEN
        </span>
        <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '11px', color: 'rgba(232,224,212,0.55)', letterSpacing: '0.04em' }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
      </div>

      {/* Nav */}
      <nav style={{ padding: '18px 48px', borderBottom: '1px solid rgba(232,224,212,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(10,10,10,0.95)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 50 }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <div style={{ lineHeight: 1.1 }}>
            <div style={{ fontSize: '22px', fontWeight: 900, letterSpacing: '-0.02em', color: '#e8e0d4' }}>TradeSignal</div>
            <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '10px', letterSpacing: '0.12em', color: 'rgba(232,224,212,0.65)', textTransform: 'uppercase' }}>Market Intelligence</div>
          </div>
        </Link>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Link href="/auth/login" style={{ textDecoration: 'none' }}><button className="btn-outline">Log In</button></Link>
          <Link href="/auth/sign-up" style={{ textDecoration: 'none' }}><button className="btn-dark">Get Started →</button></Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ padding: '80px 48px', borderBottom: '1px solid rgba(232,224,212,0.07)' }}>
        <div className="hero-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: '80px', alignItems: 'start' }}>
          <div>
            <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(232,224,212,0.55)', marginBottom: '28px' }}>
              Vol. I — Signal Intelligence
            </div>
            <h1 style={{ fontSize: '64px', fontWeight: 900, lineHeight: 1.02, letterSpacing: '-0.03em', marginBottom: '32px', color: '#e8e0d4' }}>
              The market<br />
              <em style={{ fontStyle: 'italic', fontWeight: 400, color: 'rgba(232,224,212,0.35)' }}>never</em> waits.<br />
              Your signals<br />
              {"shouldn't either."}
            </h1>
            <p className="sans" style={{ fontSize: '16px', lineHeight: 1.75, color: 'rgba(232,224,212,0.7)', maxWidth: '400px', marginBottom: '40px', fontWeight: 300 }}>
              Real RSI, MACD, and EMA calculations from live market data — combined with AI news sentiment to score every trade setup before you miss it.
            </p>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <Link href="/auth/sign-up" style={{ textDecoration: 'none' }}><button className="btn-dark">Start Free →</button></Link>
              <Link href="/auth/login" style={{ textDecoration: 'none' }}><button className="btn-outline">View Dashboard</button></Link>
            </div>
            <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '12px', color: 'rgba(232,224,212,0.65)', marginTop: '14px', letterSpacing: '0.06em' }}>NO CREDIT CARD · FREE TIER AVAILABLE</p>
          </div>

          {/* Signal feed */}
          <div style={{ border: '1px solid rgba(232,224,212,0.1)', padding: '28px', background: 'rgba(232,224,212,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(232,224,212,0.55)' }}>{"Today's Signals"}</span>
              <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '10px', color: '#7ec8a0', letterSpacing: '0.06em' }}>● Live</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 48px', gap: '8px', padding: '8px 0', borderBottom: '1px solid rgba(232,224,212,0.06)', marginBottom: '4px' }}>
              {['TICKER', 'SETUP', 'SCR'].map((h, i) => (
                <span key={i} style={{ fontFamily: '"DM Mono", monospace', fontSize: '9px', letterSpacing: '0.08em', color: 'rgba(232,224,212,0.55)', textAlign: i === 2 ? 'right' : 'left' }}>{h}</span>
              ))}
            </div>

            {signals.map((s, i) => (
              <div key={i} className="signal-row">
                <div>
                  <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '16px', fontWeight: 500, color: '#e8e0d4' }}>{s.ticker}</div>
                  <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '10px', color: s.dir === 'LONG' ? '#7ec8a0' : '#c87e7e', letterSpacing: '0.04em', marginTop: '2px' }}>
                    {s.dir === 'LONG' ? '▲' : '▼'} {s.dir}
                  </div>
                </div>
                <div>
                  <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '11px', color: 'rgba(232,224,212,0.55)', marginBottom: '6px' }}>RSI {s.rsi} · {s.macd}</div>
                  <div style={{ display: 'flex', gap: '10px', fontFamily: '"DM Mono", monospace', fontSize: '11px' }}>
                    <span style={{ color: 'rgba(232,224,212,0.5)' }}>E <strong style={{ color: '#e8e0d4' }}>${s.entry}</strong></span>
                    <span style={{ color: '#c87e7e' }}>S ${s.stop}</span>
                    <span style={{ color: '#7ec8a0' }}>T ${s.target}</span>
                  </div>
                  <div style={{ height: 2, background: 'rgba(232,224,212,0.08)', marginTop: 10, borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${s.score}%`, background: '#e8e0d4', opacity: s.score >= 55 ? 0.8 : 0.25, borderRadius: 2 }} />
                  </div>
                </div>
                <div style={{ fontFamily: '"Playfair Display", serif', fontSize: '22px', fontWeight: 700, textAlign: 'right', color: s.score >= 55 ? '#e8e0d4' : 'rgba(232,224,212,0.3)' }}>{s.score}</div>
              </div>
            ))}

            <div style={{ paddingTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
              <Link href="/auth/sign-up" style={{ textDecoration: 'none', fontFamily: '"DM Mono", monospace', fontSize: '12px', color: 'rgba(232,224,212,0.65)', display: 'flex', alignItems: 'center', gap: '4px', letterSpacing: '0.04em' }}>
                UNLOCK FULL ACCESS <ArrowUpRight size={12} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section id="how-it-works" className="stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderBottom: '1px solid rgba(232,224,212,0.07)' }}>
        {[
          { n: '6+', label: 'Technical indicators' },
          { n: '50+', label: 'Default tickers scanned' },
          { n: '1:2', label: 'Risk/reward minimum' },
          { n: 'AI', label: 'News sentiment layer' },
        ].map((s, i) => (
          <div key={i} style={{ padding: '40px 48px', borderRight: i < 3 ? '1px solid rgba(232,224,212,0.07)' : 'none' }}>
            <div className="big-number">{s.n}</div>
            <div className="sans" style={{ fontSize: '12px', color: 'rgba(232,224,212,0.55)', marginTop: '8px', fontWeight: 300 }}>{s.label}</div>
          </div>
        ))}
      </section>

      {/* Features */}
      <section id="features" style={{ padding: '80px 48px', borderBottom: '1px solid rgba(232,224,212,0.07)' }}>
        <div style={{ marginBottom: '48px' }}>
          <div className="divider" />
          <h2 style={{ fontSize: '40px', fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1.1, color: '#e8e0d4' }}>
            Professional tools.<br />
            <em style={{ fontWeight: 400, fontStyle: 'italic', color: 'rgba(232,224,212,0.35)' }}>Built for retail.</em>
          </h2>
        </div>
        <div className="feature-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', background: 'rgba(232,224,212,0.15)' }}>
          {[
            { title: 'Signal Engine', desc: 'RSI, MACD, EMA, ATR — all calculated from real Yahoo Finance daily data. No estimates, no synthetic values.' },
            { title: 'AI News Layer', desc: 'Groq AI reads every headline for your tickers and adjusts signal confidence based on real news context.' },
            { title: 'Risk Framework', desc: 'Entry, 2× ATR stop loss, and a 1:2 risk/reward target on every signal. Know your max loss before you act.' },
            { title: 'Custom Scanner', desc: 'Filter 50+ tickers by RSI range, MACD crossover, and EMA alignment. Your screener, your criteria.' },
            { title: 'AI Assistant', desc: 'Ask about any setup in plain English. Powered by Llama 3.1. Understands context, not just keywords.' },
            { title: 'Smart Alerts', desc: 'Browser push notifications when high-confidence signals fire. Manual or auto-scan mode.' },
          ].map((f, i) => (
            <div key={i} className="feature-card">
              <div className="feat-label">{String(i + 1).padStart(2, '0')}</div>
              <div className="feat-title">{f.title}</div>
              <p className="feat-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section id="pricing" style={{ padding: '80px 48px', display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', gap: '48px' }}>
        <div>
          <div className="divider" />
          <h2 style={{ fontSize: '48px', fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1.05, color: '#e8e0d4' }}>
            Ready to trade<br />with an edge?
          </h2>
          <p className="sans" style={{ marginTop: '16px', fontSize: '14px', color: 'rgba(232,224,212,0.55)', fontWeight: 300 }}>Free tier available. No credit card required.</p>
        </div>
        <Link href="/auth/sign-up" style={{ textDecoration: 'none' }}>
          <button className="btn-dark" style={{ fontSize: '14px', padding: '16px 40px' }}>
            Create Free Account →
          </button>
        </Link>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(232,224,212,0.08)', padding: '24px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '16px', fontWeight: 900, letterSpacing: '-0.01em', color: 'rgba(232,224,212,0.4)' }}>TradeSignal</span>
        <span className="sans" style={{ fontSize: '12px', color: 'rgba(232,224,212,0.55)' }}>Trading involves risk. Past performance does not guarantee future results.</span>
      </footer>
    </div>
  )
}