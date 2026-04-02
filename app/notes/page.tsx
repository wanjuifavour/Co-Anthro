'use client'
// app/notes/page.tsx
import { useState, useCallback, FormEvent } from 'react'
import { usePolling } from '@/hooks/usePolling'

interface NoteRecord {
  id: string
  author: string
  content: string
  created_at: string
}

const AUTHOR_META: Record<string, { label: string; bg: string; border: string; text: string }> = {
  A: { label: 'Person A', bg: 'var(--a-bg)', border: 'var(--a-bd)', text: 'var(--a-tx)' },
  B: { label: 'Person B', bg: 'var(--b-bg)', border: 'var(--b-bd)', text: 'var(--b-tx)' },
  C: { label: 'Person C', bg: 'var(--c-bg)', border: 'var(--c-bd)', text: 'var(--c-tx)' },
}

function formatDate(iso: string) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) +
    ' · ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

function groupByDate(notes: NoteRecord[]) {
  const groups: { date: string; notes: NoteRecord[] }[] = []
  for (const note of notes) {
    const date = new Date(note.created_at).toLocaleDateString('en-GB', {
      weekday: 'long', day: 'numeric', month: 'long',
    })
    const last = groups[groups.length - 1]
    if (last?.date === date) { last.notes.push(note) }
    else { groups.push({ date, notes: [note] }) }
  }
  return groups
}

export default function NotesPage() {
  const [notes, setNotes]       = useState<NoteRecord[]>([])
  const [loading, setLoading]   = useState(true)
  const [author, setAuthor]     = useState('A')
  const [content, setContent]   = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]       = useState('')

  const fetchNotes = useCallback(async () => {
    try {
      const res = await fetch('/api/notes')
      const data = await res.json()
      setNotes(Array.isArray(data) ? data : [])
    } catch { /* silent */ } finally { setLoading(false) }
  }, [])

  usePolling(fetchNotes, 5000)

  async function submitNote(e: FormEvent) {
    e.preventDefault()
    if (!content.trim()) return
    setSubmitting(true); setError('')
    const res = await fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ author, content: content.trim() }),
    })
    if (res.ok) {
      setContent('')
      await fetchNotes()
    } else {
      const j = await res.json()
      setError(j.error ?? 'Something went wrong')
    }
    setSubmitting(false)
  }

  const groups = groupByDate(notes)

  return (
    <div className="page">
      <div style={{ marginBottom: '1.5rem' }}>
        <h1>Notes</h1>
        <p className="text-2 text-sm mt-1">
          Daily log for end-of-day syncs, user test observations, blockers, and decisions. Append-only.
        </p>
      </div>

      {/* Compose */}
      <div className="card" style={{ padding: '1.25rem', marginBottom: '1.75rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Add a note</h3>
        <form onSubmit={submitNote}>
          {/* Author selector */}
          <div style={{ marginBottom: '.85rem' }}>
            <label>From</label>
            <div style={{ display: 'flex', gap: '.4rem' }}>
              {['A', 'B', 'C'].map(p => {
                const m = AUTHOR_META[p]
                const active = author === p
                return (
                  <button key={p} type="button" onClick={() => setAuthor(p)} style={{
                    fontFamily: 'var(--font-sans)', fontSize: '.82rem', fontWeight: 500,
                    padding: '.3rem .85rem', borderRadius: 20,
                    border: `0.5px solid ${active ? m.border : 'var(--border)'}`,
                    background: active ? m.bg : 'transparent',
                    color: active ? m.text : 'var(--text-2)',
                    cursor: 'pointer',
                  }}>
                    {m.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Content */}
          <div style={{ marginBottom: '.85rem' }}>
            <label>Note</label>
            <textarea
              rows={4}
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder={
                author === 'A' ? 'e.g. User test with Wanjiru went well — she loved the roadmap view but got confused by the onboarding form. Simplify step 2.' :
                author === 'B' ? 'e.g. AI call is working end-to-end. Response time ~4s. Prompt needs tweaking for edge case where user has no experience.' :
                'e.g. Finished hi-fi mockups for all 3 screens. Shared Figma link in group chat. Colors and fonts are locked.'
              }
              required
            />
          </div>

          {error && <p style={{ fontSize: '.82rem', color: '#991B1B', marginBottom: '.5rem' }}>{error}</p>}

          <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
            {submitting ? 'Posting…' : '+ Post note'}
          </button>
        </form>
      </div>

      {/* Log */}
      {loading ? (
        <p className="text-3 text-sm">Loading…</p>
      ) : notes.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '3rem 1rem',
          color: 'var(--text-3)', fontSize: '.9rem',
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '.5rem' }}>📝</div>
          No notes yet. Add the first one above.
        </div>
      ) : (
        <div>
          {groups.map(group => (
            <div key={group.date} style={{ marginBottom: '1.5rem' }}>
              {/* Date header */}
              <div style={{
                fontSize: '.72rem', fontFamily: 'var(--font-mono)',
                color: 'var(--text-3)', letterSpacing: '.04em',
                marginBottom: '.6rem', display: 'flex', alignItems: 'center', gap: '.6rem',
              }}>
                {group.date.toUpperCase()}
                <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              </div>

              {/* Notes for this day */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
                {group.notes.map(note => {
                  const m = AUTHOR_META[note.author] ?? AUTHOR_META.A
                  return (
                    <div key={note.id} className="card" style={{
                      padding: '1rem 1.1rem',
                      borderLeft: `3px solid ${m.border}`,
                    }}>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: '.6rem',
                        marginBottom: '.5rem', flexWrap: 'wrap',
                      }}>
                        <span className={`chip chip-${note.author.toLowerCase()}`}>{m.label}</span>
                        <span className="text-xs text-3 mono">{formatDate(note.created_at)}</span>
                      </div>
                      <p style={{
                        fontSize: '.88rem', lineHeight: 1.7,
                        whiteSpace: 'pre-wrap', color: 'var(--text)',
                      }}>
                        {note.content}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
