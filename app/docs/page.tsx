'use client'
// app/docs/page.tsx
import { useState, useCallback, useEffect, useRef } from 'react'
import { usePolling } from '@/hooks/usePolling'

const TABS = [
  {
    slug: 'persona',
    label: 'Persona',
    emoji: '👤',
    placeholder: `Name: [e.g. Amara, 24]
Age: 
Situation: [Recent grad, 6 months into first job at a mid-sized Nairobi firm]
Goal: [Wants to grow into a product manager within 2 years]
Pain point: [Doesn't know which skills to build, gets vague feedback from manager]
Quote: ["I work hard but I don't know if I'm growing in the right direction"]`,
  },
  {
    slug: 'user-journey',
    label: 'User Journey',
    emoji: '🗺️',
    placeholder: `Step 1 — [User opens the app / enters their current role and goals]
Step 2 — [AI analyzes their input and identifies skill gaps]
Step 3 — [User sees a personalized learning roadmap]
Step 4 — [User tracks progress week by week]
Step 5 — [User gets value: clarity, confidence, a plan]

Key moment: [The "aha" moment is when they see their gap visualized for the first time]`,
  },
  {
    slug: 'prd',
    label: 'PRD',
    emoji: '📋',
    placeholder: `PROBLEM
[One paragraph: what is broken, who suffers, why now]

USER
[Describe the primary user in 2-3 sentences]

CORE FEATURES (MVP only)
1. 
2. 
3. 

OUT OF SCOPE
- CV/resume building
- Job matching
- [Add others]

SUCCESS METRICS
- [e.g. A judge can complete a demo flow in under 3 minutes]
- [e.g. AI output is accurate enough that 2/3 user testers find it useful]`,
  },
  {
    slug: 'tech-stack',
    label: 'Tech Stack',
    emoji: '⚙️',
    placeholder: `FRONTEND
Framework: 
Styling: 
Hosted on: 

AI LAYER
Model: Claude claude-sonnet-4-20250514 (or specify)
API key stored: [.env.local / Vercel env]
Max tokens: 

BACKEND (if needed)
Runtime: 
Database: 
Auth: 

REPO
GitHub URL: 
Branching strategy: [e.g. main = stable, dev = active work]
Deployment: [e.g. Vercel auto-deploy from main]

ENVIRONMENT
API keys needed: ANTHROPIC_API_KEY, ...`,
  },
  {
    slug: 'ai-prompt',
    label: 'AI Prompt',
    emoji: '🤖',
    placeholder: `SYSTEM PROMPT
---
[Write the system prompt here. Be specific about role, output format, and constraints]

Example:
"You are a career growth advisor specializing in early-career professionals in East Africa.
Given a user's current role, experience level, and goals, identify their top 3 skill gaps
and provide a prioritized 30-day learning plan. Return your response as JSON with the
following structure: { gaps: string[], plan: { week: number, focus: string, resources: string[] }[] }"
---

USER INPUT FORMAT
[Describe what the user submits — e.g. role, years of experience, goals, current skills]

EXPECTED OUTPUT FORMAT
[Describe the structure Claude should return — JSON schema, markdown, plain text, etc.]

EDGE CASES & GUARDRAILS
- [e.g. If user input is too vague, ask one clarifying question]
- [e.g. If goal is unrealistic for timeframe, gently reframe]

SAMPLE INPUT
[Paste a test input here]

SAMPLE OUTPUT
[Paste the expected/actual output here]`,
  },
  {
    slug: 'competitive',
    label: 'Competitive',
    emoji: '🔍',
    placeholder: `TOOL 1: [Name]
URL: 
What it does: 
What it lacks: 
Our angle vs this: 

TOOL 2: [Name]
URL: 
What it does: 
What it lacks: 
Our angle vs this: 

TOOL 3: [Name]
URL: 
What it does: 
What it lacks: 
Our angle vs this: 

SUMMARY
Why our solution is different: 
Kenya/Africa-specific advantage: `,
  },
]

interface DocMap {
  [slug: string]: { content: string; updated_by: string; updated_at: string }
}

function timeAgo(iso: string) {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 60000)   return 'just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000)return `${Math.floor(diff / 3600000)}h ago`
  return `${Math.floor(diff / 86400000)}d ago`
}

export default function DocsPage() {
  const [docs, setDocs]         = useState<DocMap>({})
  const [activeTab, setActiveTab] = useState(TABS[0].slug)
  const [localContent, setLocalContent] = useState<Record<string, string>>({})
  const [saveStatus, setSaveStatus] = useState<Record<string, string>>({})
  const [loading, setLoading]   = useState(true)
  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  const fetchDocs = useCallback(async () => {
    try {
      const res = await fetch('/api/docs')
      const data: DocMap = await res.json()
      setDocs(data)
      // Only set local content if not currently editing
      setLocalContent(prev => {
        const next = { ...prev }
        for (const slug of Object.keys(data)) {
          if (!(slug in next)) next[slug] = data[slug].content
        }
        return next
      })
    } catch { /* silent */ } finally { setLoading(false) }
  }, [])

  usePolling(fetchDocs, 8000)

  // Initialize local content from docs when first loaded
  useEffect(() => {
    if (!loading) {
      setLocalContent(prev => {
        const next = { ...prev }
        for (const tab of TABS) {
          if (!(tab.slug in next)) {
            next[tab.slug] = docs[tab.slug]?.content ?? ''
          }
        }
        return next
      })
    }
  }, [loading, docs])

  function handleChange(slug: string, value: string) {
    setLocalContent(prev => ({ ...prev, [slug]: value }))
    setSaveStatus(prev => ({ ...prev, [slug]: 'unsaved' }))

    // Debounce save — 1.5 seconds after last keystroke
    clearTimeout(saveTimers.current[slug])
    saveTimers.current[slug] = setTimeout(() => saveDoc(slug, value), 1500)
  }

  async function saveDoc(slug: string, content: string) {
    setSaveStatus(prev => ({ ...prev, [slug]: 'saving' }))
    try {
      await fetch('/api/docs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, content }),
      })
      setSaveStatus(prev => ({ ...prev, [slug]: 'saved' }))
      setTimeout(() => setSaveStatus(prev => ({ ...prev, [slug]: '' })), 2000)
    } catch {
      setSaveStatus(prev => ({ ...prev, [slug]: 'error' }))
    }
  }

  const activeTabMeta = TABS.find(t => t.slug === activeTab)!
  const activeDoc     = docs[activeTab]
  const content       = localContent[activeTab] ?? ''
  const status        = saveStatus[activeTab] ?? ''

  return (
    <div className="page-wide">
      <div style={{ marginBottom: '1.5rem' }}>
        <h1>Docs</h1>
        <p className="text-2 text-sm mt-1">All project documentation in one place. Changes auto-save as you type.</p>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: '.3rem', flexWrap: 'wrap',
        borderBottom: '1px solid var(--border)', marginBottom: '1.25rem', paddingBottom: '.5rem',
      }}>
        {TABS.map(t => {
          const active = t.slug === activeTab
          const hasContent = !!(localContent[t.slug]?.trim() || docs[t.slug]?.content?.trim())
          return (
            <button key={t.slug} onClick={() => setActiveTab(t.slug)} style={{
              fontFamily: 'var(--font-sans)', fontSize: '.83rem', fontWeight: 500,
              padding: '.35rem .85rem', borderRadius: 'var(--radius-sm)',
              border: `1px solid ${active ? 'var(--border-strong)' : 'transparent'}`,
              background: active ? 'var(--bg-card)' : 'transparent',
              color: active ? 'var(--text)' : 'var(--text-2)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '.35rem',
              boxShadow: active ? 'var(--shadow)' : 'none',
            }}>
              <span>{t.emoji}</span>
              {t.label}
              {hasContent && (
                <span style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: active ? 'var(--spec-tx)' : 'var(--text-3)',
                  display: 'inline-block',
                }} />
              )}
            </button>
          )
        })}
      </div>

      {/* Editor */}
      <div className="card" style={{ overflow: 'hidden' }}>

        {/* Editor header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '.75rem',
          padding: '.75rem 1rem', borderBottom: '1px solid var(--border)',
          background: 'var(--bg-subtle)',
        }}>
          <span style={{ fontSize: '1.1rem' }}>{activeTabMeta.emoji}</span>
          <span style={{ fontWeight: 600, fontSize: '.9rem' }}>{activeTabMeta.label}</span>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {activeDoc?.updated_at && (
              <span className="text-xs text-3" style={{ fontFamily: 'var(--font-mono)' }}>
                updated {timeAgo(activeDoc.updated_at)}
                {activeDoc.updated_by && ` · ${activeDoc.updated_by}`}
              </span>
            )}
            <span style={{
              fontSize: '.72rem', fontFamily: 'var(--font-mono)',
              color: status === 'saved' ? 'var(--spec-tx)' : status === 'saving' ? 'var(--build-tx)' : status === 'error' ? '#991B1B' : 'transparent',
            }}>
              {status === 'saved' ? '✓ saved' : status === 'saving' ? 'saving…' : status === 'error' ? 'save failed' : status === 'unsaved' ? '● unsaved' : ''}
            </span>
          </div>
        </div>

        {/* Textarea */}
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-3)' }}>Loading…</div>
        ) : (
          <textarea
            key={activeTab}
            value={content}
            onChange={e => handleChange(activeTab, e.target.value)}
            placeholder={activeTabMeta.placeholder}
            style={{
              display: 'block', width: '100%', minHeight: 420,
              border: 'none', borderRadius: 0,
              padding: '1.1rem', fontFamily: 'var(--font-mono)',
              fontSize: '.83rem', lineHeight: 1.75,
              background: 'var(--bg-card)',
              resize: 'vertical',
            }}
          />
        )}
      </div>

      <p className="text-xs text-3 mt-2">
        Tip: Use plain text, markdown, or any format that works for your team. Content autosaves 1.5s after you stop typing.
      </p>
    </div>
  )
}
