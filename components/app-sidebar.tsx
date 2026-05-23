'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Eye,
  BarChart3,
  Bell,
  Bot,
  Settings,
  LogOut,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const mainNavItems = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Watchlist', url: '/watchlist', icon: Eye },
  { title: 'Scanner', url: '/scanner', icon: BarChart3 },
]

const alertNavItems = [
  { title: 'Signals', url: '/signals', icon: Bell },
  { title: 'AI Assistant', url: '/assistant', icon: Bot },
]

const CSS = `
  .sidebar-link {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 9px 12px;
    font-family: "DM Sans", system-ui, sans-serif;
    font-size: 13px;
    font-weight: 400;
    color: rgba(232,224,212,0.65);
    text-decoration: none;
    border-left: 2px solid transparent;
    transition: all 0.15s;
    letter-spacing: 0.01em;
    cursor: pointer;
    background: none;
    border-top: none;
    border-right: none;
    border-bottom: none;
    width: 100%;
    text-align: left;
  }
  .sidebar-link:hover {
    color: rgba(232,224,212,0.95);
    background: rgba(232,224,212,0.05);
    border-left-color: rgba(232,224,212,0.3);
  }
  .sidebar-link.active {
    color: #e8e0d4;
    background: rgba(232,224,212,0.08);
    border-left-color: #e8e0d4;
  }
  .sidebar-label {
    font-family: "DM Mono", monospace;
    font-size: 9px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: rgba(232,224,212,0.6);
    padding: 0 12px;
    margin-bottom: 4px;
    margin-top: 4px;
  }
`

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div style={{
        width: 220,
        minHeight: '100vh',
        background: '#080808',
        borderRight: '1px solid rgba(232,224,212,0.08)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
      }}>

        {/* Logo */}
        <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid rgba(232,224,212,0.07)' }}>
          <Link href="/dashboard" style={{ textDecoration: 'none' }}>
            <div style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '18px', fontWeight: 900, letterSpacing: '-0.01em', color: '#e8e0d4' }}>TradeSignal</div>
            <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '8px', letterSpacing: '0.12em', color: 'rgba(232,224,212,0.6)', textTransform: 'uppercase', marginTop: '2px' }}>Market Intelligence</div>
          </Link>
        </div>

        {/* Nav */}
        <div style={{ flex: 1, padding: '16px 0', overflowY: 'auto' }}>

          {/* Market group */}
          <div style={{ marginBottom: '24px' }}>
            <div className="sidebar-label">Market</div>
            {mainNavItems.map((item) => (
              <Link
                key={item.title}
                href={item.url}
                className={`sidebar-link ${pathname === item.url ? 'active' : ''}`}
              >
                <item.icon size={14} strokeWidth={1.5} />
                <span>{item.title}</span>
              </Link>
            ))}
          </div>

          {/* Alerts & AI group */}
          <div style={{ marginBottom: '24px' }}>
            <div className="sidebar-label">Alerts & AI</div>
            {alertNavItems.map((item) => (
              <Link
                key={item.title}
                href={item.url}
                className={`sidebar-link ${pathname === item.url ? 'active' : ''}`}
              >
                <item.icon size={14} strokeWidth={1.5} />
                <span>{item.title}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ borderTop: '1px solid rgba(232,224,212,0.07)', padding: '8px 0' }}>
          <Link
            href="/settings"
            className={`sidebar-link ${pathname === '/settings' ? 'active' : ''}`}
          >
            <Settings size={14} strokeWidth={1.5} />
            <span>Settings</span>
          </Link>
          <button className="sidebar-link" onClick={handleSignOut}>
            <LogOut size={14} strokeWidth={1.5} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </>
  )
}