import Link from 'next/link'

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=DM+Mono:wght@300;400;500&family=DM+Sans:wght@300;400;500;600&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  .btn-login {
    display: inline-block;
    background: #e8e0d4;
    color: #0a0a0a;
    border: none;
    padding: 13px 28px;
    font-family: "DM Sans", sans-serif;
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    cursor: pointer;
    transition: opacity 0.15s;
    text-decoration: none;
    margin-top: 8px;
  }
  .btn-login:hover { opacity: 0.85; }
`

export default function Page() {
  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#e8e0d4', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: '"DM Sans", sans-serif' }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* Logo */}
      <Link href="/" style={{ textDecoration: 'none', marginBottom: '48px', textAlign: 'center' }}>
        <div style={{ fontFamily: '"Playfair Display", serif', fontSize: '28px', fontWeight: 900, letterSpacing: '-0.02em', color: '#e8e0d4' }}>TradeSignal</div>
        <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '9px', letterSpacing: '0.12em', color: 'rgba(232,224,212,0.4)', textTransform: 'uppercase', marginTop: '4px' }}>Market Intelligence</div>
      </Link>

      {/* Card */}
      <div style={{ width: '100%', maxWidth: '380px', border: '1px solid rgba(232,224,212,0.12)', background: 'rgba(232,224,212,0.02)', padding: '40px', textAlign: 'center' }}>
        {/* Check mark */}
        <div style={{ width: 48, height: 48, border: '1px solid rgba(232,224,212,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px', fontFamily: '"DM Mono", monospace', fontSize: '20px', color: '#7ec8a0' }}>
          ✓
        </div>

        <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(232,224,212,0.4)', marginBottom: '12px' }}>Account created</div>

        <h1 style={{ fontFamily: '"Playfair Display", serif', fontSize: '28px', fontWeight: 900, letterSpacing: '-0.02em', color: '#e8e0d4', lineHeight: 1.1, marginBottom: '16px' }}>
          Check your<br />email.
        </h1>

        <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '14px', lineHeight: 1.7, color: 'rgba(232,224,212,0.55)', fontWeight: 300, marginBottom: '32px' }}>
          {"We've sent a confirmation link to your email address. Click it to activate your account before signing in."}
        </p>

        <Link href="/auth/login" className="btn-login">
          Go to Login →
        </Link>
      </div>

      {/* Footer note */}
      <p style={{ marginTop: '32px', fontFamily: '"DM Mono", monospace', fontSize: '10px', color: 'rgba(232,224,212,0.25)', letterSpacing: '0.04em', textAlign: 'center' }}>
        Trading involves risk. Past performance does not guarantee future results.
      </p>
    </div>
  )
}