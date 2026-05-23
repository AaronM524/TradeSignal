import { AppSidebar } from '@/components/app-sidebar'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SignalScannerWrapper } from '@/components/signals/signal-scanner-wrapper'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0a0a0a' }}>
      <AppSidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {/* Top bar */}
        <header style={{
          height: '52px',
          borderBottom: '1px solid rgba(232,224,212,0.07)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          background: 'rgba(10,10,10,0.95)',
          backdropFilter: 'blur(12px)',
          position: 'sticky',
          top: 0,
          zIndex: 40,
          flexShrink: 0,
          gap: '12px',
        }}>
          {/* Hamburger shows on mobile via CSS in AppSidebar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0, overflow: 'hidden' }}>
            <SignalScannerWrapper />
          </div>
          <div style={{
            fontFamily: '"DM Mono", monospace',
            fontSize: '11px',
            color: 'rgba(232,224,212,0.35)',
            letterSpacing: '0.04em',
            flexShrink: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: '180px',
          }}>
            {user.email}
          </div>
        </header>
        <main style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
          {children}
        </main>
      </div>
    </div>
  )
}