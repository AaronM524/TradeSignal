'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { LayoutDashboard, Eye, BarChart3, Bell, Bot, Settings, LogOut, Menu, X } from 'lucide-react'
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
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@900&family=DM+Mono:wght@400&family=DM+Sans:wght@400;500&display=swap');

  .sidebar-link {
    display: flex; align-items: center; gap: 10px;
    padding: 9px 12px;
    font-family: "DM Sans", system-ui, sans-serif;
    font-size: 13px; font-weight: 400;
    color: rgba(232,224,212,0.65);
    text-decoration: none;
    border-left: 2px solid transparent;
    transition: all 0.15s;
    cursor: pointer;
    background: none;
    border-top: none; border-right: none; border-bottom: none;
    width: 100%; text-align: left;
  }
  .sidebar-link:hover { color: rgba(232,224,212,0.95); background: rgba(232,224,212,0.05); border-left-color: rgba(232,224,212,0.3); }
  .sidebar-link.active { color: #e8e0d4; background: rgba(232,224,212,0.08); border-left-color: #e8e0d4; }
  .sidebar-label { font-family: "DM Mono", monospace; font-size: 9px; letter-spacing: 0.1em; text-transform: uppercase; color: rgba(232,224,212,0.6); padding: 0 12px; margin-bottom: 4px; margin-top: 4px; }

  .sidebar-desktop { width: 220px; min-height: 100vh; background: #080808; border-right: 1px solid rgba(232,224,212,0.08); display: flex; flex-direction: column; flex-shrink: 0; }

  .hamburger-btn { display: none; background: none; border: none; cursor: pointer; padding: 8px; color: rgba(232,224,212,0.7); }

  .mobile-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 90; }
  .mobile-drawer { display: none; position: fixed; top: 0; left: 0; width: 260px; height: 100vh; background: #080808; border-right: 1px solid rgba(232,224,212,0.08); flex-direction: column; z-index: 100; transform: translateX(-100%); transition: transform 0.25s ease; }
  .mobile-drawer.open { transform: translateX(0); }

  @media (max-width: 768px) {
    .sidebar-desktop { display: none !important; }
    .hamburger-btn { display: flex !important; align-items: center; justify-content: center; }
    .mobile-overlay.open { display: block; }
    .mobile-drawer { display: flex; }
  }
`

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const handleNav = () => onClose?.()

  return (
    <>
      {/* Logo */}
      <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid rgba(232,224,212,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/dashboard" style={{ textDecoration: 'none' }} onClick={handleNav}>
          <div style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '18px', fontWeight: 900, letterSpacing: '-0.01em', color: '#e8e0d4' }}>TradeSignal</div>
          <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '8px', letterSpacing: '0.12em', color: 'rgba(232,224,212,0.6)', textTransform: 'uppercase', marginTop: '2px' }}>Market Intelligence</div>
        </Link>
        {onClose && (
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(232,224,212,0.5)', padding: '4px' }}>
            <X size={16} />
          </button>
        )}
      </div>

      {/* Nav */}
      <div style={{ flex: 1, padding: '16px 0', overflowY: 'auto' }}>
        <div style={{ marginBottom: '24px' }}>
          <div className="sidebar-label">Market</div>
          {mainNavItems.map((item) => (
            <Link key={item.title} href={item.url} className={`sidebar-link ${pathname === item.url ? 'active' : ''}`} onClick={handleNav}>
              <item.icon size={14} strokeWidth={1.5} />
              <span>{item.title}</span>
            </Link>
          ))}
        </div>
        <div style={{ marginBottom: '24px' }}>
          <div className="sidebar-label">Alerts & AI</div>
          {alertNavItems.map((item) => (
            <Link key={item.title} href={item.url} className={`sidebar-link ${pathname === item.url ? 'active' : ''}`} onClick={handleNav}>
              <item.icon size={14} strokeWidth={1.5} />
              <span>{item.title}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{ borderTop: '1px solid rgba(232,224,212,0.07)', padding: '8px 0' }}>
        <Link href="/settings" className={`sidebar-link ${pathname === '/settings' ? 'active' : ''}`} onClick={handleNav}>
          <Settings size={14} strokeWidth={1.5} />
          <span>Settings</span>
        </Link>
        <button className="sidebar-link" onClick={handleSignOut}>
          <LogOut size={14} strokeWidth={1.5} />
          <span>Sign Out</span>
        </button>
      </div>
    </>
  )
}

export function AppSidebar() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* Desktop sidebar */}
      <div className="sidebar-desktop">
        <SidebarContent />
      </div>

      {/* Mobile hamburger button — rendered in layout topbar via portal trick, exported separately */}
      <button className="hamburger-btn" onClick={() => setMobileOpen(true)} id="mobile-menu-btn">
        <Menu size={20} />
      </button>

      {/* Mobile overlay */}
      <div className={`mobile-overlay ${mobileOpen ? 'open' : ''}`} onClick={() => setMobileOpen(false)} />

      {/* Mobile drawer */}
      <div className={`mobile-drawer ${mobileOpen ? 'open' : ''}`}>
        <SidebarContent onClose={() => setMobileOpen(false)} />
      </div>
    </>
  )
}