'use client'
// components/Nav.tsx
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'

const LINKS = [
  { href: '/',          label: 'Dashboard' },
  { href: '/ideation',  label: 'Ideation' },
  { href: '/tasks',     label: 'Tasks' },
  { href: '/docs',      label: 'Docs' },
  { href: '/notes',     label: 'Notes' },
]

export default function Nav() {
  const path = usePathname()
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)

  // Don't show nav on login page
  if (path === '/login') return null

  async function logout() {
    setLoggingOut(true)
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <nav style={{
      background: '#1A1916',
      borderBottom: '1px solid #2E2C28',
      position: 'sticky', top: 0, zIndex: 100,
    }}>
      <div style={{
        maxWidth: 1040, margin: '0 auto',
        padding: '0 1.25rem',
        display: 'flex', alignItems: 'center', gap: '1.5rem',
        height: 48,
      }}>
        {/* Wordmark */}
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: '.8rem',
          color: '#F7F6F2', letterSpacing: '.04em', fontWeight: 500,
          whiteSpace: 'nowrap', marginRight: '.5rem',
        }}>
          Co-Anthro Space
        </span>

        {/* Links */}
        <div style={{ display: 'flex', gap: '.25rem', flex: 1, overflowX: 'auto' }}>
          {LINKS.map(l => {
            const active = l.href === '/' ? path === '/' : path.startsWith(l.href)
            return (
              <Link key={l.href} href={l.href} style={{
                fontSize: '.82rem', fontWeight: 500,
                padding: '.3rem .7rem', borderRadius: 4,
                color: active ? '#F7F6F2' : '#9B9890',
                background: active ? '#2E2C28' : 'transparent',
                textDecoration: 'none', whiteSpace: 'nowrap',
                transition: 'color .15s, background .15s',
              }}>
                {l.label}
              </Link>
            )
          })}
        </div>

        {/* Logout */}
        <button onClick={logout} disabled={loggingOut} style={{
          fontFamily: 'var(--font-sans)', fontSize: '.78rem',
          color: '#9B9890', background: 'transparent',
          border: '1px solid #2E2C28', borderRadius: 4,
          padding: '.25rem .65rem', cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}>
          {loggingOut ? '...' : 'Log out'}
        </button>
      </div>
    </nav>
  )
}
