'use client'
// app/login/page.tsx
import { useState, FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function LoginForm() {
  const [pw, setPw] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const params = useSearchParams()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pw }),
    })

    if (res.ok) {
      const from = params.get('from') ?? '/'
      router.push(from)
    } else {
      setError('Wrong password. Try again.')
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', padding: '1rem',
    }}>
      <div style={{ width: '100%', maxWidth: 360 }}>

        {/* Header */}
        <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: '1rem',
            fontWeight: 500, letterSpacing: '.06em',
            color: 'var(--text)', marginBottom: '.5rem',
          }}>
            Co-Anthro Space
          </div>
          <p style={{ fontSize: '.85rem', color: 'var(--text-2)' }}>
            Team workspace · April 2–11
          </p>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: '1.75rem' }}>
          <h2 style={{ marginBottom: '1.25rem', fontSize: '1rem' }}>Enter team password</h2>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="pw">Password</label>
              <input
                id="pw"
                type="password"
                value={pw}
                onChange={e => setPw(e.target.value)}
                placeholder="••••••••"
                autoFocus
                autoComplete="current-password"
                required
              />
            </div>

            {error && (
              <p style={{ fontSize: '.82rem', color: '#991B1B', marginBottom: '.75rem' }}>{error}</p>
            )}

            <button type="submit" className="btn btn-primary w-full" disabled={loading} style={{ justifyContent: 'center' }}>
              {loading ? 'Checking…' : 'Enter workspace →'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', fontSize: '.75rem', color: 'var(--text-3)', marginTop: '1.25rem' }}>
          Hackathon ends April 11 · 11:00 AM sharp
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
