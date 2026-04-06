'use client'
// app/docs/page.tsx
import { useState, useCallback, useEffect, useRef } from 'react'
import { usePolling } from '@/hooks/usePolling'
import { TEAM_ROLES, getTeamMemberName, type TeamRole } from '@/lib/team'

const DOC_DEFAULTS = {
  persona: `Amara, 24 — Junior Data Analyst
Situation: Three weeks into placement with a Dutch fintech. Remote from Nairobi, managing a 2-hour timezone gap, trying to adapt to a new work culture.
Pain point: Gets vague feedback, does not know how to act on it, and feels vulnerable asking for help in front of a client manager.
Need: A guide that feels safe, reads carefully, responds specifically, and helps her improve without making the struggle feel bigger than it is.
Quote: "I work hard but I do not know if I am growing in the right direction."

Brian — TS Associate at Tana
Situation: Manages a portfolio of professionals across multiple client companies.
Pain point: Too many messages to read deeply, cannot spot patterns without piecing them together manually, and often walks into calls without a clear view of what to probe.
Need: A tool that reads everything and surfaces what matters, with risk flags and suggested questions before manager calls.`,
  'user-journey': `1. Professional posts an end-of-day update in Slack.
2. Tana Buddy reads the update, checks it against recent context, and replies in the thread with a warm, specific response.
3. The same signal is summarized into the TS dashboard so associates can see portfolio health, risk flags, and trends.
4. The professional can also DM Buddy for coaching, feedback interpretation, or support.
5. If there is a wellbeing concern, the system flags it for TS with a proposed response plan.

Key moment: the professional feels noticed and guided, while the TS associate gets the same situation in one place without manual triage.`,
  prd: `PROBLEM
Early-career Kenyan professionals placed with European companies have to prove themselves in unfamiliar work contexts, manage dual reporting, and grow fast without a reliable day-to-day guide.

USER
Primary user: the placed professional who needs coaching, clarification, and support inside Slack.
Secondary user: the TS associate who needs real-time visibility across a portfolio of professionals.

CORE FEATURES (MVP only)
1. Slack-based EOD reading and thread response.
2. Private DM coaching with structured AI responses.
3. TS dashboard with portfolio health, risk flags, and manager sync prep.

OUT OF SCOPE
- Client manager access.
- Full onboarding and consent flow.
- Cohort analytics and advanced reporting.
- Non-essential reflection automation.

SUCCESS METRICS
- Professionals feel understood and supported.
- TS associates can identify who needs attention without reading every message.
- Placement outcomes improve through earlier intervention.
- A judge can understand the demo flow and the value in under 3 minutes.`,
  'tech-stack': `FRONTEND
Framework: Next.js
Styling: App router UI with simple dashboard and docs views
Hosted on: Vercel Hobby

AI LAYER
Model for EOD and coaching: Claude Haiku
Model for manager sync briefs: Claude Sonnet
Output format: structured JSON for downstream parsing

BACKEND
Runtime: Next.js API routes
Database: Xata PostgreSQL endpoint
Auth: simple team password cookie auth

REPO
GitHub repo: Co-Anthro
Branching strategy: main as working branch for the hackathon workspace
Deployment: Vercel auto-deploy from main

ENVIRONMENT
API keys needed: XATA_DB_URL, TEAM_PASSWORD, AUTH_SECRET`,
  'ai-prompt': `SYSTEM PROMPT
You are Tana Buddy, an AI support companion for early-career professionals placed through Tana.
You respond inside Slack, read the latest end-of-day update, compare it with recent context, and reply in a warm, specific, and practical way.
Return structured JSON only with fields for thread response, private DM response, health signal, reasoning, wellbeing concern, summary, proposed plan, and goal updates.

USER INPUT FORMAT
Professional name, company context, recent EOD text, goals, and prior recent summaries.

EXPECTED OUTPUT FORMAT
{
  "thread_response": "...",
  "dm_response": "...",
  "health_signal": "stable | watch | at_risk",
  "health_reasoning": "...",
  "wellbeing_concern": false,
  "wellbeing_summary": null,
  "proposed_plan": null,
  "goal_updates": []
}

EDGE CASES & GUARDRAILS
- If the input is vague, keep the response grounded and ask at most one clarifying question.
- If the message suggests distress, summarize without quoting private text verbatim.
- Never mention internal policy or expose manager-facing content in the DM.

SAMPLE INPUT
EOD: I had a rough meeting with my manager today but I finished the data cleanup and I am waiting for comments.

SAMPLE OUTPUT
{
  "thread_response": "...",
  "dm_response": "...",
  "health_signal": "watch",
  "health_reasoning": "...",
  "wellbeing_concern": false,
  "wellbeing_summary": null,
  "proposed_plan": null,
  "goal_updates": []
}`,
  competitive: `TOOL 1: Manual TS tracking
What it does: Helps associates keep notes and follow up manually.
What it lacks: No automatic reading of EODs, no real-time risk signals, and no proactive coaching loop.
Our angle vs this: Tana Buddy reads the signal where the work already happens and turns it into action.

TOOL 2: Generic Slack bot
What it does: Sends reminders or simple commands in Slack.
What it lacks: No placement context, no coaching depth, and no support for TS portfolio visibility.
Our angle vs this: Tana Buddy is purpose-built for placement support and associate oversight.

TOOL 3: Generic wellbeing check-in tools
What it does: Captures moods and wellness self-reports.
What it lacks: Weak workflow integration and little connection to actual work output.
Our angle vs this: Tana Buddy combines wellbeing signals with professional context and manager prep.

SUMMARY
Why our solution is different: it sits inside Slack, understands the placement context, and serves both the professional and TS associate.
Kenya/Africa-specific advantage: it is tuned for early-career placement realities, time zones, and cross-cultural reporting pressure.`,
} as const

const TABS = [
  {
    slug: 'persona',
    label: 'Persona',
    emoji: '👤',
    placeholder: DOC_DEFAULTS.persona,
  },
  {
    slug: 'user-journey',
    label: 'User Journey',
    emoji: '🗺️',
    placeholder: DOC_DEFAULTS['user-journey'],
  },
  {
    slug: 'prd',
    label: 'PRD',
    emoji: '📋',
    placeholder: DOC_DEFAULTS.prd,
  },
  {
    slug: 'tech-stack',
    label: 'Tech Stack',
    emoji: '⚙️',
    placeholder: DOC_DEFAULTS['tech-stack'],
  },
  {
    slug: 'ai-prompt',
    label: 'AI Prompt',
    emoji: '🤖',
    placeholder: DOC_DEFAULTS['ai-prompt'],
  },
  {
    slug: 'competitive',
    label: 'Competitive',
    emoji: '🔍',
    placeholder: DOC_DEFAULTS.competitive,
  },
]

interface DocMap {
  [slug: string]: { content: string; updated_by: string; updated_at: string }
}

function timeAgo(iso: string) {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 60000) return 'just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  return `${Math.floor(diff / 86400000)}d ago`
}

export default function DocsPage() {
  const [docs, setDocs] = useState<DocMap>({})
  const [activeTab, setActiveTab] = useState(TABS[0].slug)
  const [activeEditor, setActiveEditor] = useState<TeamRole>('A')
  const [localContent, setLocalContent] = useState<Record<string, string>>({})
  const [saveStatus, setSaveStatus] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [downloadingPdf, setDownloadingPdf] = useState(false)
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
        body: JSON.stringify({ slug, content, updated_by: getTeamMemberName(activeEditor) }),
      })
      setSaveStatus(prev => ({ ...prev, [slug]: 'saved' }))
      setTimeout(() => setSaveStatus(prev => ({ ...prev, [slug]: '' })), 2000)
    } catch {
      setSaveStatus(prev => ({ ...prev, [slug]: 'error' }))
    }
  }

  async function downloadSpecAsPdf() {
    setDownloadingPdf(true)
    try {
      const res = await fetch('/api/docs/download?slug=tana-buddy-spec')
      if (!res.ok) throw new Error('download failed')

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const contentDisposition = res.headers.get('Content-Disposition') ?? ''
      const fileNameMatch = contentDisposition.match(/filename="?([^\"]+)"?/i)
      const fileName = fileNameMatch?.[1] ?? 'tana-buddy-spec.pdf'
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } finally {
      setDownloadingPdf(false)
    }
  }

  const activeTabMeta = TABS.find(t => t.slug === activeTab)!
  const activeDoc = docs[activeTab]
  const content = localContent[activeTab] ?? ''
  const status = saveStatus[activeTab] ?? ''

  return (
    <div className="page-wide">
      <div style={{ marginBottom: '1.5rem' }}>
        <h1>Docs</h1>
        <p className="text-2 text-sm mt-1">All project documentation in one place. Changes auto-save as you type.</p>
        <div style={{ marginTop: '.75rem', display: 'flex', gap: '.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            type="button"
            onClick={downloadSpecAsPdf}
            disabled={downloadingPdf}
            style={{
              fontFamily: 'var(--font-sans)', fontSize: '.82rem', fontWeight: 500,
              padding: '.45rem .85rem', borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-strong)',
              background: 'var(--bg-subtle)',
              color: 'var(--text)', cursor: downloadingPdf ? 'not-allowed' : 'pointer',
            }}
          >
            {downloadingPdf ? 'Preparing PDF…' : 'Download Tana Buddy Spec PDF'}
          </button>
          <span className="text-xs text-3">Uploaded and ready for download.</span>
        </div>
      </div>

      {/* Editor selector */}
      <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <span style={{ alignSelf: 'center', fontSize: '.82rem', color: 'var(--text-2)' }}>Editing as:</span>
        {TEAM_ROLES.map(role => {
          const active = activeEditor === role
          return (
            <button
              key={role}
              type="button"
              onClick={() => setActiveEditor(role)}
              style={{
                fontFamily: 'var(--font-sans)', fontSize: '.82rem', fontWeight: 500,
                padding: '.3rem .85rem', borderRadius: 20,
                border: `0.5px solid ${active ? 'var(--border-strong)' : 'var(--border)'}`,
                background: active ? 'var(--bg-subtle)' : 'transparent',
                color: active ? 'var(--text)' : 'var(--text-2)',
                cursor: 'pointer',
              }}
            >
              {getTeamMemberName(role)}
            </button>
          )
        })}
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
