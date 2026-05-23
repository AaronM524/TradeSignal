'use client'

import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=DM+Mono:wght@300;400;500&family=DM+Sans:wght@300;400;500;600&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  .login-input {
    width: 100%;
    background: rgba(232,224,212,0.04);
    border: 1px solid rgba(232,224,212,0.15);
    color: #e8e0d4;
    padding: 12px 16px;
    font-family: "DM Sans", sans-serif;
    font-size: 14px;
    outline: none;
    transition: border-color 0.2s;
  }
  .login-input::placeholder { color: rgba(232,224,212,0.25); }
  .login-input:focus { border-color: rgba(232,224,212,0.45); }
  .login-label {
    font-family: "DM Mono", monospace;
    font-size: 10px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: rgba(232,224,212,0.55);
    margin-bottom: 8px;
    display: block;
  }
  .btn-submit {
    width: 100%;
    background: #e8e0d4;
    color: #0a0a0a;
    border: none;
    padding: 14px;
    font-family: "DM Sans", sans-serif;
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    cursor: pointer;
    transition: opacity 0.15s;
    margin-top: 8px;
  }
  .btn-submit:hover { opacity: 0.85; }
  .btn-submit:disabled { opacity: 0.4; cursor: not-allowed; }
`

export default function Page() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      router.push('/dashboard')
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#e8e0d4', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: '"DM Sans", sans-serif' }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* Logo */}
      <Link href="/" style={{ textDecoration: 'none', marginBottom: '48px', textAlign: 'center' }}>
        <div style={{ fontFamily: '"Playfair Display", serif', fontSize: '28px', fontWeight: 900, letterSpacing: '-0.02em', color: '#e8e0d4' }}>TradeSignal</div>
        <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '9px', letterSpacing: '0.12em', color: 'rgba(232,224,212,0.4)', textTransform: 'uppercase', marginTop: '4px' }}>Market Intelligence</div>
      </Link>

      {/* Card */}
      <div style={{ width: '100%', maxWidth: '380px', border: '1px solid rgba(232,224,212,0.12)', background: 'rgba(232,224,212,0.02)', padding: '40px' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(232,224,212,0.4)', marginBottom: '12px' }}>Welcome back</div>
          <h1 style={{ fontFamily: '"Playfair Display", serif', fontSize: '28px', fontWeight: 900, letterSpacing: '-0.02em', color: '#e8e0d4', lineHeight: 1.1 }}>Sign in to your<br />account.</h1>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label className="login-label" htmlFor="email">Email</label>
              <input
                id="email"
                className="login-input"
                type="email"
                placeholder="you@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="login-label" htmlFor="password">Password</label>
              <input
                id="password"
                className="login-input"
                type="password"
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '11px', color: '#c87e7e', letterSpacing: '0.02em' }}>{error}</p>
            )}

            <button type="submit" className="btn-submit" disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Sign In →'}
            </button>
          </div>

          <div style={{ marginTop: '24px', textAlign: 'center', fontFamily: '"DM Sans", sans-serif', fontSize: '13px', color: 'rgba(232,224,212,0.45)' }}>
            {"Don't have an account? "}
            <Link href="/auth/sign-up" style={{ color: '#e8e0d4', textDecoration: 'none', borderBottom: '1px solid rgba(232,224,212,0.3)' }}>
              Sign up
            </Link>
          </div>
        </form>
      </div>

      {/* Footer note */}
      <p style={{ marginTop: '32px', fontFamily: '"DM Mono", monospace', fontSize: '10px', color: 'rgba(232,224,212,0.25)', letterSpacing: '0.04em', textAlign: 'center' }}>
        Trading involves risk. Past performance does not guarantee future results.
      </p>
    </div>
  )
}