'use client'
// app/ideation/page.tsx
import { useState, useCallback, FormEvent } from 'react'
import { usePolling } from '@/hooks/usePolling'

const CRITERIA = [
  { key: 'impact',       label: 'Impact',       desc: 'How meaningful is this for early career talent?' },
  { key: 'feasibility',  label: 'Feasibility',  desc: 'Can we build a compelling demo in 8 days?' },
  { key: 'demo',         label: 'Demo-ability',  desc: 'Will this impress judges in a 15-min presentation?' },
  { key: 'relevance',    label: 'Relevance',     desc: 'How well does it fit the hackathon theme?' },
]

const PEOPLE = ['A', 'B', 'C']

interface IdeaRecord {
  id: string
  title: string
  description: string
  scores: Record<string, Record<string, number>>
  problem_statement: string
}

function totalScore(idea: IdeaRecord) {
  let sum = 0
  for (const person of PEOPLE) {
    for (const c of CRITERIA) {
      sum += idea.scores?.[person]?.[c.key] ?? 0
    }
  }
  return sum
}

function maxScore() { return PEOPLE.length * CRITERIA.length * 3 }

export default function IdeationPage() {
  const [ideas, setIdeas]         = useState<IdeaRecord[]>([])
  const [winnerId, setWinnerId]   = useState<string | null>(null)
  const [activePerson, setActivePerson] = useState<string>('A')
  const [loading, setLoading]     = useState(true)

  // New idea form
  const [title, setTitle]         = useState('')
  const [desc, setDesc]           = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  // Lock + problem statement
  const [lockTarget, setLockTarget] = useState<string | null>(null)
  const [problemStmt, setProblemStmt] = useState('')
  const [locking, setLocking]     = useState(false)
  const [savingPs, setSavingPs]   = useState(false)

  const winner = ideas.find(i => i.id === winnerId)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/ideas')
      const { ideas: data, winner_id } = await res.json()
      setIdeas(data ?? [])
      setWinnerId(winner_id ?? null)
      if (winner_id) {
        const w = data?.find((i: IdeaRecord) => i.id === winner_id)
        if (w) setProblemStmt(w.problem_statement ?? '')
      }
    } catch { /* silent */ } finally { setLoading(false) }
  }, [])

  usePolling(fetchData, 5000)

  async function submitIdea(e: FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setSubmitting(true); setFormError('')
    const res = await fetch('/api/ideas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: title.trim(), description: desc.trim() }),
    })
    if (res.ok) { setTitle(''); setDesc(''); await fetchData() }
    else { const j = await res.json(); setFormError(j.error ?? 'Error') }
    setSubmitting(false)
  }

  async function vote(idea_id: string, criteria: string, value: number) {
    if (winnerId) return
    await fetch('/api/ideas/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idea_id, person: activePerson, criteria, value }),
    })
    await fetchData()
  }

  async function lockIdea() {
    if (!lockTarget) return
    setLocking(true)
    const res = await fetch('/api/ideas/lock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ winner_id: lockTarget, problem_statement: problemStmt }),
    })
    if (res.ok) { setWinnerId(lockTarget); await fetchData() }
    setLocking(false); setLockTarget(null)
  }

  async function saveProblemStatement() {
    if (!winnerId) return
    setSavingPs(true)
    await fetch('/api/ideas/lock', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ winner_id: winnerId, problem_statement: problemStmt }),
    })
    setSavingPs(false)
  }

  const sorted = [...ideas].sort((a, b) => totalScore(b) - totalScore(a))

  return (
    <div className="page">
      <div style={{ marginBottom: '1.5rem' }}>
        <h1>Ideation</h1>
        <p className="text-2 text-sm mt-1">Submit ideas, score them together, then lock the winner.</p>
      </div>

      {/* Locked state banner */}
      {winner && (
        <div style={{
          background: 'var(--spec-bg)', border: '1px solid var(--spec-bd)',
          borderRadius: 'var(--radius)', padding: '1.1rem 1.25rem', marginBottom: '1.5rem',
        }}>
          <div style={{ fontSize: '.7rem', fontFamily: 'var(--font-mono)', color: 'var(--spec-tx)', marginBottom: '.3rem' }}>
            ✓ IDEA LOCKED
          </div>
          <h2 style={{ color: 'var(--spec-tx)', marginBottom: '.5rem' }}>{winner.title}</h2>
          {winner.description && (
            <p style={{ fontSize: '.85rem', color: 'var(--spec-tx)', marginBottom: '.75rem', opacity: .85 }}>
              {winner.description}
            </p>
          )}

          {/* Problem statement editor */}
          <label style={{ color: 'var(--spec-tx)' }}>Problem statement (edit any time)</label>
          <textarea
            rows={3}
            value={problemStmt}
            onChange={e => setProblemStmt(e.target.value)}
            placeholder="Who is the user? What is their pain? Why does it matter in the Kenyan/African early-career context?"
            style={{ marginBottom: '.5rem' }}
          />
          <button className="btn btn-sm" onClick={saveProblemStatement} disabled={savingPs}
            style={{ background: 'var(--spec-tx)', color: '#fff', border: 'none' }}>
            {savingPs ? 'Saving…' : 'Save statement'}
          </button>
        </div>
      )}

      {/* Person selector */}
      {!winnerId && (
        <div style={{ marginBottom: '1.25rem' }}>
          <p className="text-sm text-2 mb-2">Voting as:</p>
          <div style={{ display: 'flex', gap: '.5rem' }}>
            {PEOPLE.map(p => (
              <button key={p} className={`btn ${activePerson === p ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setActivePerson(p)}>
                Person {p}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Submit idea form */}
      {!winnerId && (
        <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Submit an idea</h3>
          <form onSubmit={submitIdea}>
            <div style={{ marginBottom: '.75rem' }}>
              <label>Idea title *</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                placeholder="e.g. AI Skill Gap Analyzer" required />
            </div>
            <div style={{ marginBottom: '.75rem' }}>
              <label>Short description</label>
              <textarea rows={2} value={desc} onChange={e => setDesc(e.target.value)}
                placeholder="What does it do and who is it for?" />
            </div>
            {formError && <p style={{ fontSize: '.82rem', color: '#991B1B', marginBottom: '.5rem' }}>{formError}</p>}
            <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
              {submitting ? 'Adding…' : '+ Add idea'}
            </button>
          </form>
        </div>
      )}

      {/* Ideas list */}
      {loading ? (
        <p className="text-3 text-sm">Loading…</p>
      ) : ideas.length === 0 ? (
        <p className="text-3 text-sm">No ideas yet. Add the first one above.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
          {sorted.map((idea, idx) => {
            const score = totalScore(idea)
            const isWinner = idea.id === winnerId
            const isTop = !winnerId && idx === 0 && ideas.length > 1

            return (
              <div key={idea.id} className="card" style={{
                border: isWinner ? '1.5px solid var(--spec-bd)' : undefined,
                overflow: 'hidden',
              }}>
                {/* Idea header */}
                <div style={{ padding: '1rem 1.1rem', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '.75rem' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', flexWrap: 'wrap', marginBottom: '.25rem' }}>
                        <h3>{idea.title}</h3>
                        {isWinner && <span className="chip chip-spec">Winner ✓</span>}
                        {isTop && !isWinner && <span className="chip chip-build">Top score</span>}
                      </div>
                      {idea.description && (
                        <p className="text-sm text-2">{idea.description}</p>
                      )}
                    </div>

                    {/* Total score */}
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.3rem', fontWeight: 500 }}>{score}</div>
                      <div className="text-xs text-3">/ {maxScore()}</div>
                    </div>
                  </div>

                  {/* Score progress */}
                  <div style={{ marginTop: '.6rem' }}>
                    <div className="progress-wrap">
                      <div className="progress-bar" style={{ width: `${(score / maxScore()) * 100}%` }} />
                    </div>
                  </div>
                </div>

                {/* Scoring grid */}
                <div style={{ padding: '1rem 1.1rem' }}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: `1fr repeat(${PEOPLE.length}, auto)`,
                    gap: '.4rem .75rem', alignItems: 'center',
                  }}>
                    {/* Header row */}
                    <div />
                    {PEOPLE.map(p => (
                      <div key={p} style={{
                        fontSize: '.72rem', fontFamily: 'var(--font-mono)',
                        color: activePerson === p && !winnerId ? 'var(--text)' : 'var(--text-3)',
                        textAlign: 'center', fontWeight: activePerson === p && !winnerId ? 600 : 400,
                      }}>
                        {p}
                      </div>
                    ))}

                    {/* Criteria rows */}
                    {CRITERIA.map(c => (
                      <>
                        <div key={`label-${c.key}`} title={c.desc} style={{ fontSize: '.82rem', cursor: 'help' }}>
                          {c.label}
                        </div>
                        {PEOPLE.map(p => {
                          const val = idea.scores?.[p]?.[c.key] ?? 0
                          const isMe = p === activePerson && !winnerId
                          return (
                            <div key={`${p}-${c.key}`} style={{ display: 'flex', gap: 3, justifyContent: 'center' }}>
                              {[1, 2, 3].map(v => (
                                <button key={v} onClick={() => isMe && vote(idea.id, c.key, v)}
                                  style={{
                                    width: 22, height: 22, borderRadius: 3,
                                    border: val === v ? '1.5px solid var(--accent)' : '1px solid var(--border)',
                                    background: val === v ? 'var(--accent)' : 'transparent',
                                    color: val === v ? '#fff' : 'var(--text-3)',
                                    fontSize: '.72rem', fontWeight: 500,
                                    cursor: isMe ? 'pointer' : 'default',
                                    fontFamily: 'var(--font-mono)',
                                    opacity: isMe ? 1 : .7,
                                  }}>
                                  {v}
                                </button>
                              ))}
                            </div>
                          )
                        })}
                      </>
                    ))}
                  </div>
                </div>

                {/* Lock button */}
                {!winnerId && (
                  <div style={{ padding: '.75rem 1.1rem', borderTop: '1px solid var(--border)', background: 'var(--bg-subtle)' }}>
                    {lockTarget === idea.id ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', flexWrap: 'wrap' }}>
                        <span className="text-sm" style={{ color: 'var(--pitch-tx)' }}>
                          Lock &ldquo;{idea.title}&rdquo; as the winner? This cannot be undone.
                        </span>
                        <div style={{ display: 'flex', gap: '.5rem' }}>
                          <button className="btn btn-sm btn-primary" onClick={lockIdea} disabled={locking}>
                            {locking ? 'Locking…' : 'Confirm lock'}
                          </button>
                          <button className="btn btn-sm btn-ghost" onClick={() => setLockTarget(null)}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <button className="btn btn-sm btn-ghost" onClick={() => setLockTarget(idea.id)}>
                        🔒 Lock as winner
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
