'use client'
// components/Countdown.tsx
import { useState, useEffect } from 'react'
import { getHackathonDeadline } from '@/lib/time'

function pad(n: number) { return String(n).padStart(2, '0') }

export default function Countdown() {
  const [parts, setParts] = useState({ d: 0, h: 0, m: 0, s: 0, past: false })
  const [deadline] = useState(() => getHackathonDeadline())

  useEffect(() => {
    function tick() {
      const diff = deadline.getTime() - Date.now()
      if (diff <= 0) { setParts({ d: 0, h: 0, m: 0, s: 0, past: true }); return }
      const d = Math.floor(diff / 86400000)
      const h = Math.floor((diff % 86400000) / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setParts({ d, h, m, s, past: false })
    }
    tick()
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [deadline])

  if (parts.past) {
    return (
      <div style={{
        background: 'var(--pitch-bg)', border: '1px solid var(--pitch-bd)',
        borderRadius: 'var(--radius)', padding: '.75rem 1rem',
        fontFamily: 'var(--font-mono)', fontSize: '.9rem',
        color: 'var(--pitch-tx)', fontWeight: 500,
      }}>
        🔴 Hard stop passed — no more building.
      </div>
    )
  }

  const cells = [
    { label: 'days', val: parts.d },
    { label: 'hours', val: parts.h },
    { label: 'mins', val: parts.m },
    { label: 'secs', val: parts.s },
  ]

  const urgent = parts.d === 0 && parts.h < 12

  return (
    <div style={{
      background: urgent ? 'var(--pitch-bg)' : 'var(--bg-subtle)',
      border: `1px solid ${urgent ? 'var(--pitch-bd)' : 'var(--border)'}`,
      borderRadius: 'var(--radius)', padding: '.9rem 1.1rem',
      display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap',
    }}>
      <span style={{ fontSize: '.75rem', color: 'var(--text-3)', fontFamily: 'var(--font-mono)', minWidth: 110 }}>
        BUILD STOPS IN
      </span>
      <div style={{ display: 'flex', gap: '.5rem', alignItems: 'baseline' }}>
        {cells.map(c => (
          <div key={c.label} style={{ textAlign: 'center' }}>
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: '1.4rem', fontWeight: 500,
              lineHeight: 1, color: urgent ? 'var(--pitch-tx)' : 'var(--text)',
            }}>
              {pad(c.val)}
            </div>
            <div style={{ fontSize: '.65rem', color: 'var(--text-3)', marginTop: 2 }}>{c.label}</div>
          </div>
        ))}
      </div>
      <span style={{ fontSize: '.75rem', color: 'var(--text-3)', marginLeft: 'auto' }}>
        Apr 11 · 11:00 AM EAT
      </span>
    </div>
  )
}
