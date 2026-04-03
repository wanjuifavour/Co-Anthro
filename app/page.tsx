'use client'
// app/page.tsx
import { useState, useCallback } from 'react'
import Link from 'next/link'
import Countdown from '@/components/Countdown'
import { usePolling } from '@/hooks/usePolling'
import { DAYS, TOTAL_TASKS, PHASE_META, WHO_META } from '@/lib/taskData'
import { getHackathonDayIndex, getHackathonYear } from '@/lib/time'

interface TaskState {
  [key: string]: { checked: boolean; checked_by: string; checked_at: string }
}

interface IdeaRecord { id: string; title: string; problem_statement: string }

const NAV_CARDS = [
  { href: '/ideation', label: 'Ideation', desc: 'Vote and lock your idea', emoji: '💡' },
  { href: '/tasks', label: 'Tasks', desc: 'Day-by-day task board', emoji: '✅' },
  { href: '/docs', label: 'Docs', desc: 'PRD, personas, prompts & more', emoji: '📄' },
  { href: '/notes', label: 'Notes', desc: 'Daily log and team observations', emoji: '📝' },
]

function getTodayDayIndex() {
  return getHackathonDayIndex()
}

export default function DashboardPage() {
  const [taskState, setTaskState] = useState<TaskState>({})
  const [winner, setWinner] = useState<IdeaRecord | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const [taskRes, ideaRes] = await Promise.all([
        fetch('/api/tasks'),
        fetch('/api/ideas'),
      ])
      const tasks = await taskRes.json()
      const { ideas, winner_id } = await ideaRes.json()
      setTaskState(tasks)
      if (winner_id) setWinner(ideas.find((i: IdeaRecord) => i.id === winner_id) ?? null)
    } catch { /* silent */ } finally {
      setLoading(false)
    }
  }, [])

  usePolling(fetchData, 5000)

  const doneTasks = Object.values(taskState).filter(v => v.checked).length
  const pct = TOTAL_TASKS > 0 ? Math.round((doneTasks / TOTAL_TASKS) * 100) : 0
  const todayIndex = getTodayDayIndex()
  const today = DAYS[todayIndex]
  const pc = PHASE_META[today.phase]
  const year = getHackathonYear()

  return (
    <div className="page">

      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1>Co-Anthro</h1>
        <p className="text-2 text-sm mt-1">AI Hackathon · Early Career Talent · April 2–11, {year}</p>
      </div>

      {/* Countdown */}
      <Countdown />

      {/* Winner banner */}
      {winner && (
        <div style={{
          marginTop: '1rem',
          background: 'var(--spec-bg)', border: '1px solid var(--spec-bd)',
          borderRadius: 'var(--radius)', padding: '1rem 1.1rem',
        }}>
          <div style={{ fontSize: '.72rem', fontFamily: 'var(--font-mono)', color: 'var(--spec-tx)', marginBottom: '.3rem' }}>
            LOCKED IDEA
          </div>
          <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--spec-tx)' }}>
            {winner.title}
          </div>
          {winner.problem_statement && (
            <p style={{ fontSize: '.83rem', color: 'var(--spec-tx)', marginTop: '.4rem', opacity: .85 }}>
              {winner.problem_statement}
            </p>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="stats-grid mt-4">
        <div className="stat">
          <div className="stat-label">TOTAL TASKS</div>
          <div className="stat-val">{TOTAL_TASKS}</div>
        </div>
        <div className="stat">
          <div className="stat-label">COMPLETED</div>
          <div className="stat-val">{loading ? '—' : doneTasks}</div>
        </div>
        <div className="stat">
          <div className="stat-label">PROGRESS</div>
          <div className="stat-val">{loading ? '—' : pct + '%'}</div>
        </div>
      </div>

      {/* Progress bar */}
      {!loading && (
        <div style={{ marginTop: '.75rem' }}>
          <div className="progress-wrap">
            <div className="progress-bar" style={{ width: pct + '%' }} />
          </div>
        </div>
      )}

      <hr className="divider" style={{ margin: '1.5rem 0' }} />

      {/* Today section */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', marginBottom: '1rem' }}>
          <h2>Today</h2>
          <span className={`chip chip-${today.phase}`}>{pc.label}</span>
          <span style={{ fontSize: '.83rem', color: 'var(--text-2)' }}>{today.date} · {today.label}</span>
        </div>

        <div className="card" style={{ overflow: 'hidden' }}>
          {today.tasks.map((task, ti) => {
            const key = `${todayIndex}-${ti}`
            const done = taskState[key]?.checked ?? false
            const wm = WHO_META[task.who]
            const isMilestone = task.title.startsWith('MILESTONE') || task.title.startsWith('HARD STOP')
            return (
              <div key={ti} style={{
                display: 'flex', alignItems: 'flex-start', gap: '10px',
                padding: '.8rem 1rem',
                borderBottom: ti < today.tasks.length - 1 ? '1px solid var(--border)' : 'none',
                background: done ? 'var(--bg-subtle)' : 'transparent',
                opacity: done ? .6 : 1,
              }}>
                <div style={{
                  width: 16, height: 16, borderRadius: 3, flexShrink: 0, marginTop: 2,
                  border: `1.5px solid ${done ? wm.border : 'var(--border-strong)'}`,
                  background: done ? wm.bg : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {done && <span style={{ fontSize: 9, color: wm.text, fontWeight: 600 }}>✓</span>}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: '.85rem', fontWeight: 500,
                      textDecoration: done ? 'line-through' : 'none',
                      color: isMilestone ? 'var(--pitch-tx)' : 'var(--text)',
                    }}>{task.title}</span>
                    <span className={`chip chip-${task.who.toLowerCase() === 'all' ? 'all' : task.who.toLowerCase()}`}>
                      {task.who === 'ALL' ? 'Full team' : wm.label}
                    </span>
                  </div>
                  <p className="text-3 text-xs mt-1">{task.detail}</p>
                </div>
              </div>
            )
          })}
        </div>
        <p style={{ fontSize: '.75rem', color: 'var(--text-3)', marginTop: '.5rem' }}>
          Check tasks off on the <Link href="/tasks" style={{ color: 'var(--text-2)' }}>Tasks page</Link>
        </p>
      </div>

      {/* Quick nav */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '.75rem' }}>
        {NAV_CARDS.map(c => (
          <Link key={c.href} href={c.href} style={{ textDecoration: 'none' }}>
            <div className="card" style={{
              padding: '1rem 1.1rem', cursor: 'pointer',
              transition: 'box-shadow .15s',
            }}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = 'var(--shadow-md)')}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = 'var(--shadow)')}
            >
              <div style={{ fontSize: '1.2rem', marginBottom: '.3rem' }}>{c.emoji}</div>
              <div style={{ fontWeight: 600, fontSize: '.9rem' }}>{c.label}</div>
              <div style={{ fontSize: '.78rem', color: 'var(--text-2)', marginTop: '.2rem' }}>{c.desc}</div>
            </div>
          </Link>
        ))}
      </div>

    </div>
  )
}
