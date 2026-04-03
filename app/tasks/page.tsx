'use client'
// app/tasks/page.tsx
import { useState, useCallback } from 'react'
import { usePolling } from '@/hooks/usePolling'
import { DAYS, TOTAL_TASKS, PHASE_META, WHO_META, type Who } from '@/lib/taskData'
import { getHackathonDayIndex } from '@/lib/time'
import { getTeamMemberName } from '@/lib/team'

interface TaskState {
  [key: string]: { checked: boolean; checked_by: string; checked_at: string }
}

const FILTER_OPTIONS: { val: string; label: string }[] = [
  { val: 'ALL', label: 'All tasks' },
  { val: 'A', label: `${getTeamMemberName('A')} · Product` },
  { val: 'B', label: `${getTeamMemberName('B')} · Builder` },
  { val: 'C', label: `${getTeamMemberName('C')} · Design` },
]

function getTodayDayIndex() {
  return getHackathonDayIndex()
}

export default function TasksPage() {
  const [taskState, setTaskState] = useState<TaskState>({})
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('ALL')
  const [openDay, setOpenDay] = useState<number>(getTodayDayIndex())
  const [toggling, setToggling] = useState<string | null>(null)

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch('/api/tasks')
      const data = await res.json()
      setTaskState(data)
    } catch { /* silent */ } finally { setLoading(false) }
  }, [])

  usePolling(fetchTasks, 5000)

  async function toggleTask(dayI: number, taskI: number, currentlyChecked: boolean) {
    const key = `${dayI}-${taskI}`
    setToggling(key)

    // Optimistic update
    setTaskState(prev => ({
      ...prev,
      [key]: { checked: !currentlyChecked, checked_by: 'team', checked_at: new Date().toISOString() },
    }))

    try {
      await fetch('/api/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task_key: key, checked: !currentlyChecked, checked_by: filter }),
      })
    } catch {
      // Revert on failure
      setTaskState(prev => ({
        ...prev,
        [key]: { checked: currentlyChecked, checked_by: 'team', checked_at: '' },
      }))
    } finally {
      setToggling(null)
    }
  }

  const doneTasks = Object.values(taskState).filter(v => v.checked).length
  const pct = Math.round((doneTasks / TOTAL_TASKS) * 100)
  const todayI = getTodayDayIndex()

  return (
    <div className="page">
      <div style={{ marginBottom: '1.5rem' }}>
        <h1>Tasks</h1>
        <p className="text-2 text-sm mt-1">Click any task to check it off. Updates sync across the team in ~5 seconds.</p>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: '.75rem' }}>
        <div className="stat">
          <div className="stat-label">TOTAL</div>
          <div className="stat-val">{TOTAL_TASKS}</div>
        </div>
        <div className="stat">
          <div className="stat-label">DONE</div>
          <div className="stat-val">{loading ? '—' : doneTasks}</div>
        </div>
        <div className="stat">
          <div className="stat-label">PROGRESS</div>
          <div className="stat-val">{loading ? '—' : pct + '%'}</div>
        </div>
      </div>

      <div className="progress-wrap" style={{ marginBottom: '1.25rem' }}>
        <div className="progress-bar" style={{ width: pct + '%' }} />
      </div>

      {/* Phase legend */}
      <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        {Object.entries(PHASE_META).map(([k, v]) => (
          <span key={k} className={`chip chip-${k}`}>{v.label}</span>
        ))}
      </div>

      {/* Person filter */}
      <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        {FILTER_OPTIONS.map(o => {
          const active = filter === o.val
          const wm = o.val !== 'ALL' ? WHO_META[o.val] : null
          return (
            <button key={o.val} onClick={() => setFilter(o.val)} style={{
              fontFamily: 'var(--font-sans)', fontSize: '.8rem', fontWeight: 500,
              padding: '.3rem .8rem', borderRadius: 20,
              border: `0.5px solid ${active && wm ? wm.border : active ? 'var(--border-strong)' : 'var(--border)'}`,
              background: active && wm ? wm.bg : active ? 'var(--bg-subtle)' : 'transparent',
              color: active && wm ? wm.text : active ? 'var(--text)' : 'var(--text-2)',
              cursor: 'pointer',
            }}>
              {o.label}
            </button>
          )
        })}
      </div>

      {/* Day accordions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
        {DAYS.map((day, di) => {
          const pc = PHASE_META[day.phase]
          const visibleTasks = filter === 'ALL'
            ? day.tasks
            : day.tasks.filter(t => t.who === filter || t.who === 'ALL')

          if (visibleTasks.length === 0) return null

          const dayDone = visibleTasks.filter((_, tii) => {
            const origI = day.tasks.indexOf(visibleTasks[tii])
            return taskState[`${di}-${origI}`]?.checked
          }).length

          const isToday = di === todayI
          const hasMilestone = day.tasks.some(t => t.title.startsWith('MILESTONE') || t.title.startsWith('HARD STOP'))
          const isOpen = openDay === di

          return (
            <div key={di} className="card" style={{
              overflow: 'hidden',
              border: isOpen ? `1px solid ${pc.border}` : isToday ? '1px solid var(--border-strong)' : undefined,
            }}>
              {/* Day header */}
              <div
                onClick={() => setOpenDay(isOpen ? -1 : di)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '.6rem',
                  padding: '.75rem 1rem', cursor: 'pointer',
                  background: isOpen ? pc.bg : isToday ? 'var(--bg-subtle)' : 'transparent',
                  flexWrap: 'wrap',
                }}
              >
                <span className={`chip chip-${day.phase}`}>{pc.label}</span>
                <span style={{ fontWeight: 500, fontSize: '.9rem' }}>{day.date}</span>
                <span className="text-sm text-2">{day.label}</span>

                {isToday && (
                  <span style={{
                    fontSize: '.7rem', padding: '1px 7px', borderRadius: 20,
                    background: 'var(--accent)', color: 'var(--accent-fg)',
                  }}>today</span>
                )}

                {hasMilestone && (
                  <span className="chip chip-pitch" style={{ marginLeft: 'auto' }}>milestone</span>
                )}

                <span className="text-xs text-3" style={{ marginLeft: hasMilestone ? 0 : 'auto' }}>
                  {dayDone}/{visibleTasks.length}
                </span>
                <span className="text-xs text-3">{isOpen ? '▲' : '▼'}</span>
              </div>

              {/* Tasks */}
              {isOpen && (
                <div style={{ borderTop: `1px solid ${pc.border}` }}>
                  {visibleTasks.map((task, tii) => {
                    const origI = day.tasks.indexOf(task)
                    const key = `${di}-${origI}`
                    const done = taskState[key]?.checked ?? false
                    const by = taskState[key]?.checked_by
                    const wm = WHO_META[task.who]
                    const isMilestone = task.title.startsWith('MILESTONE') || task.title.startsWith('HARD STOP')
                    const isToggling = toggling === key

                    return (
                      <div
                        key={tii}
                        onClick={() => !isToggling && toggleTask(di, origI, done)}
                        style={{
                          display: 'flex', alignItems: 'flex-start', gap: '10px',
                          padding: '.85rem 1rem',
                          borderBottom: tii < visibleTasks.length - 1 ? '1px solid var(--border)' : 'none',
                          cursor: 'pointer',
                          background: done ? 'var(--bg-subtle)' : 'transparent',
                          opacity: done ? .65 : 1,
                          transition: 'background .1s, opacity .1s',
                        }}
                      >
                        {/* Checkbox */}
                        <div style={{
                          width: 18, height: 18, borderRadius: 4, flexShrink: 0, marginTop: 1,
                          border: `1.5px solid ${done ? wm.border : 'var(--border-strong)'}`,
                          background: done ? wm.bg : 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'background .1s',
                        }}>
                          {done && <span style={{ fontSize: 10, color: wm.text, fontWeight: 600 }}>✓</span>}
                          {isToggling && !done && <span style={{ fontSize: 10, color: 'var(--text-3)' }}>…</span>}
                        </div>

                        {/* Content */}
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: '.25rem' }}>
                            <span style={{
                              fontSize: '.87rem', fontWeight: 500,
                              textDecoration: done ? 'line-through' : 'none',
                              color: isMilestone ? 'var(--pitch-tx)' : 'var(--text)',
                            }}>
                              {task.title}
                            </span>
                            <span className={`chip chip-${(task.who as Who).toLowerCase() === 'all' ? 'all' : (task.who as Who).toLowerCase()}`}>
                              {task.who === 'ALL' ? 'Full team' : wm.label}
                            </span>
                          </div>
                          <p className="text-xs text-3" style={{ lineHeight: 1.6 }}>{task.detail}</p>
                          {done && by && by !== 'team' && (
                            <p className="text-xs text-3 mt-1" style={{ fontFamily: 'var(--font-mono)' }}>
                              ✓ checked by Person {by}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
