'use client'

import Link from 'next/link'
import { ArrowUpRight, Search, Bell } from 'lucide-react'
import { useEffect, useState } from 'react'

const DEMO_STEP_DURATION = 4200

function useCycle(steps: number, duration: number) {
  const [active, setActive] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setActive((a) => (a + 1) % steps), duration)
    return () => clearInterval(id)
  }, [steps, duration])
  return [active, setActive] as const
}

function ScanCounter({ active }: { active: boolean }) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!active) {
      setCount(0)
      return
    }
    let n = 0
    const id = setInterval(() => {
      n += Math.ceil(Math.random() * 5)
      if (n >= 50) {
        n = 50
        clearInterval(id)
      }
      setCount(n)
    }, 110)
    return () => clearInterval(id)
  }, [active])
  return <>{count}</>
}

function ScoreCounter({ active, target }: { active: boolean; target: number }) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!active) {
      setVal(0)
      return
    }
    let n = 0
    const id = setInterval(() => {
      n += 2
      if (n >= target) {
        n = target
        clearInterval(id)
      }
      setVal(n)
    }, 28)
    return () => clearInterval(id)
  }, [active, target])
  return <>{val}</>
}

const scanTickers = [
  { t: 'AAPL', pct: 40 },
  { t: 'NVDA', pct: 85 },
  { t: 'MSFT', pct: 55 },
  { t: 'AMD', pct: 70 },
  { t: 'TSLA', pct: 30 },
  { t: 'META', pct: 60 },
]

const scoreRows = [
  { label: 'RSI 66.7', pct: 67 },
  { label: 'MACD · Bearish Cross', pct: 80 },
  { label: 'News Sentiment · Negative', pct: 55 },
]

function DemoWindow({ active, setActive }: { active: number; setActive: (n: number) => void }) {
  return (
    <div className="demo-window">
      <div className="demo-titlebar">
        <div className="demo-dots"><span /><span /><span /></div>
        <span className="demo-titletext mono">tradesignal.app — live preview</span>
      </div>
      <div className="demo-progress-row">
        {[0, 1, 2].map((i) => (
          <button key={i} className="demo-progress-track" onClick={() => setActive(i)} aria-label={`Show step ${i + 1}`}>
            <div
              className={`demo-progress-fill ${i < active ? 'filled' : ''} ${i === active ? 'active' : ''}`}
              style={i === active ? { animationDuration: `${DEMO_STEP_DURATION}ms` } : {}}
            />
          </button>
        ))}
      </div>
      <div className="demo-body">
        {active === 0 && (
          <div className="demo-scan">
            <div className="demo-scan-header">
              <Search size={13} color="rgba(232,224,212,0.55)" />
              <span className="mono">SCANNING <ScanCounter active={active === 0} />/50 TICKERS</span>
            </div>
            <div className="demo-scan-list">
              {scanTickers.map((row, i) => (
                <div key={row.t} className="demo-scan-row" style={{ animationDelay: `${i * 90}ms` }}>
                  <span className="mono">{row.t}</span>
                  <span className="demo-scan-bar">
                    <span style={{ width: `${row.pct}%`, animationDelay: `${i * 90 + 200}ms` }} />
                  </span>
                </div>
              ))}
              <div className="demo-sweep" />
            </div>
          </div>
        )}
        {active === 1 && (
          <div className="demo-score">
            <div className="demo-score-ticker">
              <span style={{ fontFamily: '"Playfair Display", serif', fontSize: 22, fontWeight: 700 }}>NVDA</span>
              <span className="mono" style={{ fontSize: 11, color: '#c87e7e' }}>▼ SHORT</span>
            </div>
            <div className="demo-score-rows">
              {scoreRows.map((r, i) => (
                <div key={r.label} className="demo-score-row">
                  <span className="mono">{r.label}</span>
                  <span className="demo-score-track">
                    <span style={{ width: `${r.pct}%`, animationDelay: `${i * 150}ms` }} />
                  </span>
                </div>
              ))}
            </div>
            <div className="demo-score-ring">
              <div className="demo-score-num"><ScoreCounter active={active === 1} target={58} /></div>
              <span className="mono" style={{ fontSize: 9, color: 'rgba(232,224,212,0.45)' }}>CONFIDENCE</span>
            </div>
          </div>
        )}
        {active === 2 && (
          <div className="demo-alert-wrap">
            <div className="demo-alert-card">
              <div className="demo-alert-top">
                <Bell size={13} color="#e8e0d4" />
                <span className="mono" style={{ fontSize: 10, letterSpacing: '0.06em' }}>TRADESIGNAL ALERT</span>
                <span className="mono" style={{ fontSize: 9, color: 'rgba(232,224,212,0.4)', marginLeft: 'auto' }}>JUST NOW</span>
              </div>
              <div className="demo-alert-main">
                <span style={{ fontFamily: '"Playfair Display", serif', fontSize: 18, fontWeight: 700 }}>NVDA</span>
                <span className="mono" style={{ fontSize: 11, color: '#c87e7e' }}>▼ SHORT · SCORE 58</span>
              </div>
              <div className="demo-alert-levels mono">
                <span>E <strong>$219.51</strong></span>
                <span style={{ color: '#c87e7e' }}>S $236.19</span>
                <span style={{ color: '#7ec8a0' }}>T $186.14</span>
              </div>
              <div className="demo-alert-foot mono">Sent to your browser · Manual review recommended</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const signals = [
  { ticker: 'NVDA', dir: 'SHORT', score: 58, rsi: 66.7, macd: 'Bearish · MACD Cross', entry: '219.51', stop: '236.19', target: '186.14' },
  { ticker: 'MSFT', dir: 'LONG', score: 45, rsi: 54.0, macd: 'Bullish · Trend', entry: '419.09', stop: '397.07', target: '463.12' },
  { ticker: 'AMD', dir: 'SHORT', score: 43, rsi: 70.2, macd: 'Bearish · Momentum', entry: '448.56', stop: '502.97', target: '339.73' },
]

const howItWorks = [
  { step: '01', title: 'We scan the market', desc: '50+ tickers pulled daily from live Yahoo Finance data — RSI, MACD, EMA, and ATR calculated fresh, no synthetic values.' },
  { step: '02', title: 'AI scores every setup', desc: 'Groq reads real news headlines for each ticker and adjusts a 0–100 confidence score based on technicals + sentiment.' },
  { step: '03', title: 'You get the alert', desc: 'High-confidence signals push straight to your browser with entry, stop, and target already calculated.' },
]

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700&family=DM+Mono:wght@300;400;500&family=Inter:wght@300;400;500&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  .mono { font-family: "DM Mono", monospace; }
  .sans { font-family: "Inter", system-ui, sans-serif; }
  .nav-link { font-family: "Inter", sans-serif; font-size: 12px; font-weight: 500; letter-spacing: 0.06em; text-transform: uppercase; color: rgba(232,224,212,0.6); text-decoration: none; transition: color 0.2s; }
  .nav-link:hover { color: #e8e0d4; }
  .btn-dark { background: #e8e0d4; color: #0a0a0a; border: none; padding: 12px 28px; font-family: "Inter", sans-serif; font-size: 12px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; cursor: pointer; transition: opacity 0.15s; white-space: nowrap; }
  .btn-dark:hover { opacity: 0.85; }
  .btn-outline { background: transparent; color: rgba(232,224,212,0.75); border: 1px solid rgba(232,224,212,0.35); padding: 11px 28px; font-family: "Inter", sans-serif; font-size: 12px; font-weight: 500; letter-spacing: 0.06em; text-transform: uppercase; cursor: pointer; transition: all 0.15s; white-space: nowrap; }
  .btn-outline:hover { border-color: rgba(232,224,212,0.65); color: #e8e0d4; }
  .signal-row { display: grid; grid-template-columns: 80px 1fr 48px; align-items: center; padding: 16px 0; border-bottom: 1px solid rgba(232,224,212,0.1); gap: 16px; }
  .divider { width: 40px; height: 1px; background: rgba(232,224,212,0.5); margin-bottom: 24px; }
  .feature-card { padding: 28px; border: 1px solid rgba(232,224,212,0.15); background: #0a0a0a; transition: all 0.2s; }
  .feature-card:hover { background: rgba(232,224,212,0.03); border-color: rgba(232,224,212,0.35); }
  .feat-label { font-family: "Inter", sans-serif; font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; color: rgba(232,224,212,0.45); margin-bottom: 12px; }
  .feat-title { font-size: 17px; font-weight: 700; margin-bottom: 10px; line-height: 1.2; color: #e8e0d4; }
  .feat-desc { font-family: "Inter", sans-serif; font-size: 13px; line-height: 1.65; color: rgba(232,224,212,0.6); font-weight: 300; }
  .big-number { font-family: "Playfair Display", serif; font-size: 48px; font-weight: 900; line-height: 1; letter-spacing: -0.04em; color: #e8e0d4; }
  .step-card { padding: 28px 0; border-bottom: 1px solid rgba(232,224,212,0.1); cursor: pointer; transition: opacity 0.25s; }
  .step-card:last-child { border-bottom: none; }
  .step-card.dim { opacity: 0.4; }
  .footer-link { font-family: "Inter", sans-serif; font-size: 11px; letter-spacing: 0.04em; color: rgba(232,224,212,0.5); text-decoration: none; transition: color 0.15s; }
  .footer-link:hover { color: #e8e0d4; }

  /* Live demo window */
  .demo-window { border: 1px solid rgba(232,224,212,0.15); background: #050505; border-radius: 6px; overflow: hidden; height: 100%; min-height: 380px; display: flex; flex-direction: column; }
  .demo-titlebar { display: flex; align-items: center; gap: 10px; padding: 12px 16px; border-bottom: 1px solid rgba(232,224,212,0.08); background: rgba(232,224,212,0.02); }
  .demo-dots { display: flex; gap: 5px; }
  .demo-dots span { width: 7px; height: 7px; border-radius: 50%; background: rgba(232,224,212,0.18); display: block; }
  .demo-titletext { font-size: 10px; color: rgba(232,224,212,0.4); letter-spacing: 0.04em; }
  .demo-progress-row { display: flex; gap: 6px; padding: 14px 16px 0; }
  .demo-progress-track { flex: 1; height: 3px; background: rgba(232,224,212,0.12); border-radius: 2px; overflow: hidden; border: none; padding: 0; cursor: pointer; }
  .demo-progress-fill { display: block; height: 100%; width: 0%; background: rgba(232,224,212,0.75); }
  .demo-progress-fill.filled { width: 100%; }
  .demo-progress-fill.active { animation: fillProgress linear forwards; }
  .demo-body { flex: 1; padding: 28px; display: flex; align-items: center; justify-content: center; }

  .demo-scan { width: 100%; }
  .demo-scan-header { display: flex; align-items: center; gap: 8px; font-size: 10px; letter-spacing: 0.08em; color: rgba(232,224,212,0.55); margin-bottom: 18px; }
  .demo-scan-list { position: relative; display: flex; flex-direction: column; gap: 12px; overflow: hidden; min-height: 220px; padding-top: 4px; }
  .demo-scan-row { display: flex; align-items: center; justify-content: space-between; font-size: 12px; color: rgba(232,224,212,0.7); opacity: 0; animation: fadeSlideIn 0.4s ease forwards; }
  .demo-scan-bar { flex: 1; margin-left: 12px; height: 3px; background: rgba(232,224,212,0.08); border-radius: 2px; overflow: hidden; display: block; max-width: 130px; }
  .demo-scan-bar span { display: block; height: 100%; transform-origin: left; transform: scaleX(0); background: rgba(126,200,160,0.65); animation: barGrowScale 1s ease forwards; }
  .demo-sweep { position: absolute; left: 0; right: 0; height: 50px; top: -50px; background: linear-gradient(180deg, transparent, rgba(232,224,212,0.07), transparent); animation: scanSweepTop 2.6s linear infinite; pointer-events: none; }

  .demo-score { width: 100%; display: flex; flex-direction: column; gap: 22px; }
  .demo-score-ticker { display: flex; align-items: baseline; gap: 10px; }
  .demo-score-rows { display: flex; flex-direction: column; gap: 12px; }
  .demo-score-row { display: flex; flex-direction: column; gap: 6px; font-size: 11px; color: rgba(232,224,212,0.55); }
  .demo-score-track { height: 4px; background: rgba(232,224,212,0.08); border-radius: 2px; overflow: hidden; }
  .demo-score-track span { display: block; height: 100%; transform-origin: left; transform: scaleX(0); background: #e8e0d4; opacity: 0.65; animation: barGrowScale 0.9s ease forwards; }
  .demo-score-ring { align-self: center; width: 88px; height: 88px; border-radius: 50%; border: 2px solid rgba(232,224,212,0.25); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; margin-top: 2px; }
  .demo-score-num { font-family: "Playfair Display", serif; font-size: 28px; font-weight: 900; color: #e8e0d4; }

  .demo-alert-wrap { width: 100%; display: flex; justify-content: center; }
  .demo-alert-card { width: 100%; max-width: 280px; border: 1px solid rgba(232,224,212,0.2); background: rgba(232,224,212,0.03); padding: 18px; border-radius: 4px; animation: fadeSlideIn 0.5s ease; }
  .demo-alert-top { display: flex; align-items: center; gap: 8px; margin-bottom: 14px; }
  .demo-alert-main { display: flex; align-items: baseline; gap: 10px; margin-bottom: 12px; }
  .demo-alert-levels { display: flex; gap: 14px; font-size: 11px; color: rgba(232,224,212,0.6); margin-bottom: 10px; flex-wrap: wrap; }
  .demo-alert-foot { font-size: 9px; color: rgba(232,224,212,0.35); letter-spacing: 0.03em; }

  @keyframes fillProgress { from { width: 0%; } to { width: 100%; } }
  @keyframes fadeSlideIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
  @keyframes barGrowScale { to { transform: scaleX(1); } }
  @keyframes scanSweepTop { 0% { top: -50px; } 100% { top: 260px; } }

  /* Responsive grid classes */
  .hero-grid { display: grid; grid-template-columns: 1fr 420px; gap: 80px; align-items: start; }
  .feature-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px; background: rgba(232,224,212,0.15); }
  .stat-grid { display: grid; grid-template-columns: repeat(3, 1fr); }
  .cta-grid { display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 48px; }
  .how-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 64px; align-items: center; }

  @media (max-width: 900px) {
    .hero-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
    .feature-grid { grid-template-columns: repeat(2, 1fr) !important; }
    .stat-grid { grid-template-columns: repeat(2, 1fr) !important; }
    .cta-grid { grid-template-columns: 1fr !important; gap: 24px !important; }
    .how-grid { grid-template-columns: 1fr !important; gap: 32px !important; }
  }

  @media (max-width: 600px) {
    .lp-section { padding: 48px 20px !important; }
    .lp-ticker { padding: 8px 20px !important; }
    .lp-nav { padding: 14px 20px !important; }
    .lp-footer { padding: 24px 20px !important; }
    .feature-grid { grid-template-columns: 1fr !important; }
    .stat-grid { grid-template-columns: repeat(2, 1fr) !important; }
    .lp-h1 { font-size: 40px !important; }
    .lp-h2 { font-size: 32px !important; }
    .lp-cta-h2 { font-size: 36px !important; }
    .lp-stat-pad { padding: 24px 20px !important; }
    .lp-nav-btns { gap: 6px !important; }
    .btn-dark, .btn-outline { padding: 10px 16px !important; font-size: 11px !important; }
    .hero-btns { flex-wrap: wrap; }
    .signal-feed { display: none !important; }
  }
`

function getMarketStatus() {
  // Approximate NYSE hours in ET (9:30am–4:00pm, Mon–Fri). Rough client-side check.
  const now = new Date()
  const etString = now.toLocaleString('en-US', { timeZone: 'America/New_York' })
  const et = new Date(etString)
  const day = et.getDay()
  const minutes = et.getHours() * 60 + et.getMinutes()

  if (day === 0 || day === 6) return 'NYSE CLOSED'
  if (minutes < 9 * 60 + 30) return 'PRE-MARKET'
  if (minutes >= 9 * 60 + 30 && minutes < 16 * 60) return 'NYSE OPEN'
  if (minutes >= 16 * 60 && minutes < 20 * 60) return 'AFTER HOURS'
  return 'NYSE CLOSED'
}

export default function LandingPage() {
  const [marketStatus, setMarketStatus] = useState('NYSE OPEN')
  const [demoStep, setDemoStep] = useCycle(3, DEMO_STEP_DURATION)

  useEffect(() => {
    setMarketStatus(getMarketStatus())
    const interval = setInterval(() => setMarketStatus(getMarketStatus()), 60_000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#e8e0d4', fontFamily: '"Playfair Display", Georgia, serif', overflowX: 'hidden' }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* Top ticker bar */}
      <div className="lp-ticker" style={{ background: '#050505', padding: '8px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(232,224,212,0.06)', flexWrap: 'wrap', gap: '8px' }}>
        <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '11px', color: 'rgba(232,224,212,0.6)', letterSpacing: '0.06em' }}>
          SPY <span style={{ color: '#7ec8a0' }}>+0.82%</span>
          {' · '}QQQ <span style={{ color: '#7ec8a0' }}>+1.04%</span>
          {' · '}VIX <span style={{ color: '#c87e7e' }}>18.3</span>
          {' · '}{marketStatus}
        </span>
        <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '11px', color: 'rgba(232,224,212,0.55)', letterSpacing: '0.04em' }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
      </div>

      {/* Nav */}
      <nav className="lp-nav" style={{ padding: '18px 48px', borderBottom: '1px solid rgba(232,224,212,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(10,10,10,0.95)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 50 }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <div style={{ lineHeight: 1.1 }}>
            <div style={{ fontSize: '20px', fontWeight: 900, letterSpacing: '-0.02em', color: '#e8e0d4' }}>TradeSignal</div>
            <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '9px', letterSpacing: '0.12em', color: 'rgba(232,224,212,0.65)', textTransform: 'uppercase' }}>Market Intelligence</div>
          </div>
        </Link>
        <div className="lp-nav-btns" style={{ display: 'flex', gap: '10px' }}>
          <Link href="/auth/login" style={{ textDecoration: 'none' }}><button className="btn-outline">Log In</button></Link>
          <Link href="/auth/sign-up" style={{ textDecoration: 'none' }}><button className="btn-dark">Start Free →</button></Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="lp-section" style={{ padding: '80px 48px', borderBottom: '1px solid rgba(232,224,212,0.07)' }}>
        <div className="hero-grid">
          <div>
            <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(232,224,212,0.55)', marginBottom: '28px' }}>
              Vol. I — Signal Intelligence
            </div>
            <h1 className="lp-h1" style={{ fontSize: '64px', fontWeight: 900, lineHeight: 1.02, letterSpacing: '-0.03em', marginBottom: '32px', color: '#e8e0d4' }}>
              The market<br />
              <em style={{ fontStyle: 'italic', fontWeight: 400, color: 'rgba(232,224,212,0.35)' }}>never</em> waits.<br />
              Your signals<br />
              {"shouldn't either."}
            </h1>
            <p className="sans" style={{ fontSize: '16px', lineHeight: 1.75, color: 'rgba(232,224,212,0.7)', maxWidth: '400px', marginBottom: '40px', fontWeight: 300 }}>
              Real RSI, MACD, and EMA calculations from live market data — combined with AI news sentiment to score every trade setup before you miss it.
            </p>
            <div className="hero-btns" style={{ display: 'flex', gap: '12px' }}>
              <Link href="/auth/sign-up" style={{ textDecoration: 'none' }}><button className="btn-dark">Start Free →</button></Link>
              <Link href="/auth/login" style={{ textDecoration: 'none' }}><button className="btn-outline">View Dashboard</button></Link>
            </div>
            <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '12px', color: 'rgba(232,224,212,0.65)', marginTop: '14px', letterSpacing: '0.06em' }}>NO CREDIT CARD · FREE TIER AVAILABLE</p>
          </div>

          {/* Signal feed — hidden on small mobile */}
          <div className="signal-feed" style={{ border: '1px solid rgba(232,224,212,0.1)', padding: '28px', background: 'rgba(232,224,212,0.02)' }}>
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
                  <div style={{ display: 'flex', gap: '8px', fontFamily: '"DM Mono", monospace', fontSize: '11px', flexWrap: 'wrap' }}>
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
            <div style={{ paddingTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
              <span className="sans" style={{ fontSize: '10px', lineHeight: 1.5, color: 'rgba(232,224,212,0.4)', maxWidth: '220px' }}>
                Score = 0–100 confluence of RSI, MACD &amp; news sentiment. Informational only — not investment advice.
              </span>
              <Link href="/auth/sign-up" style={{ textDecoration: 'none', fontFamily: '"DM Mono", monospace', fontSize: '12px', color: 'rgba(232,224,212,0.65)', display: 'flex', alignItems: 'center', gap: '4px', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
                UNLOCK FULL ACCESS <ArrowUpRight size={12} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="stat-grid" style={{ borderBottom: '1px solid rgba(232,224,212,0.07)' }}>
        {[
          { n: '6+', label: 'Technical indicators' },
          { n: '50+', label: 'Default tickers scanned' },
          { n: 'AI', label: 'News sentiment layer' },
        ].map((s, i) => (
          <div key={i} className="lp-stat-pad" style={{ padding: '40px 48px', borderRight: i < 2 ? '1px solid rgba(232,224,212,0.07)' : 'none' }}>
            <div className="big-number">{s.n}</div>
            <div className="sans" style={{ fontSize: '12px', color: 'rgba(232,224,212,0.55)', marginTop: '8px', fontWeight: 300 }}>{s.label}</div>
          </div>
        ))}
      </section>

      {/* How it works + demo */}
      <section className="lp-section" style={{ padding: '80px 48px', borderBottom: '1px solid rgba(232,224,212,0.07)' }}>
        <div style={{ marginBottom: '48px' }}>
          <div className="divider" />
          <h2 className="lp-h2" style={{ fontSize: '40px', fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1.1, color: '#e8e0d4' }}>
            How it works.
          </h2>
        </div>
        <div className="how-grid">
          <div>
            {howItWorks.map((s, i) => (
              <div
                key={i}
                className={`step-card ${demoStep === i ? '' : 'dim'}`}
                onClick={() => setDemoStep(i)}
              >
                <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                  <span style={{ fontFamily: '"Playfair Display", serif', fontSize: '28px', fontWeight: 900, color: demoStep === i ? 'rgba(232,224,212,0.7)' : 'rgba(232,224,212,0.3)', lineHeight: 1, transition: 'color 0.25s' }}>{s.step}</span>
                  <div>
                    <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px', color: '#e8e0d4' }}>{s.title}</div>
                    <p className="feat-desc" style={{ maxWidth: '380px' }}>{s.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <DemoWindow active={demoStep} setActive={setDemoStep} />
        </div>
      </section>

      {/* Features */}
      <section className="lp-section" style={{ padding: '80px 48px', borderBottom: '1px solid rgba(232,224,212,0.07)' }}>
        <div style={{ marginBottom: '48px' }}>
          <div className="divider" />
          <h2 className="lp-h2" style={{ fontSize: '40px', fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1.1, color: '#e8e0d4' }}>
            Professional tools.<br />
            <em style={{ fontWeight: 400, fontStyle: 'italic', color: 'rgba(232,224,212,0.35)' }}>Built for retail.</em>
          </h2>
        </div>
        <div className="feature-grid">
          {[
            { title: 'Signal Engine', desc: 'RSI, MACD, EMA, ATR — all calculated from real Yahoo Finance daily data. No estimates, no synthetic values.' },
            { title: 'AI News Layer', desc: 'AI reads every headline for your tickers and adjusts signal confidence based on real news context.' },
            { title: 'Risk Framework', desc: 'Entry, 2× ATR stop loss, and a 1:2 risk/reward target on every signal. Know your max loss before you act.' },
            { title: 'Custom Scanner', desc: 'Filter 50+ tickers by RSI range, MACD crossover, and EMA alignment. Your screener, your criteria.' },
            { title: 'AI Assistant', desc: 'Ask about any setup in plain English. Understands context, not just keywords.' },
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
      <section className="lp-section cta-grid" style={{ padding: '80px 48px' }}>
        <div>
          <div className="divider" />
          <h2 className="lp-cta-h2" style={{ fontSize: '48px', fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1.05, color: '#e8e0d4' }}>
            Ready to trade<br />with an edge?
          </h2>
          <p className="sans" style={{ marginTop: '16px', fontSize: '14px', color: 'rgba(232,224,212,0.55)', fontWeight: 300 }}>Free tier available. No credit card required.</p>
        </div>
        <Link href="/auth/sign-up" style={{ textDecoration: 'none' }}>
          <button className="btn-dark" style={{ fontSize: '14px', padding: '16px 40px' }}>
            Start Free →
          </button>
        </Link>
      </section>

      {/* Footer */}
      <footer className="lp-footer" style={{ borderTop: '1px solid rgba(232,224,212,0.08)', padding: '40px 48px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '24px', marginBottom: '28px' }}>
          <div>
            <span style={{ fontSize: '18px', fontWeight: 900, letterSpacing: '-0.01em', color: 'rgba(232,224,212,0.7)' }}>TradeSignal</span>
            <div className="sans" style={{ fontSize: '11px', color: 'rgba(232,224,212,0.4)', marginTop: '4px' }}>
              © {new Date().getFullYear()} TradeSignal. All rights reserved.
            </div>
          </div>
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
            <Link href="/privacy" className="footer-link">Privacy Policy</Link>
            <Link href="/terms" className="footer-link">Terms of Service</Link>
            <Link href="/disclosures" className="footer-link">Risk Disclosures</Link>
            <Link href="/contact" className="footer-link">Contact</Link>
          </div>
        </div>
        <p className="sans" style={{ fontSize: '11px', lineHeight: 1.7, color: 'rgba(232,224,212,0.4)', maxWidth: '780px', fontWeight: 300, borderTop: '1px solid rgba(232,224,212,0.06)', paddingTop: '20px' }}>
          TradeSignal provides market data and algorithmically generated technical analysis for informational and educational purposes only. Nothing on this site constitutes financial, investment, legal, or tax advice, or a recommendation to buy or sell any security. Trading involves substantial risk of loss and is not suitable for every investor. Past performance and backtested or historical signals are not indicative of future results. TradeSignal is not a registered broker-dealer, investment advisor, or financial planner. Always conduct your own research and consult a licensed professional before making investment decisions.
        </p>
      </footer>
    </div>
  )
}