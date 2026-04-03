// app/api/ideas/vote/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { xataGet, xataUpdate, xataFindOne } from '@/lib/xata'

interface IdeaRecord {
  id: string
  scores: Record<string, Record<string, number>>
}

export async function POST(req: NextRequest) {
  try {
    const { idea_id, person, criteria, value } = await req.json()
    // person: 'A' | 'B' | 'C', criteria: 'impact'|'feasibility'|'demo'|'relevance', value: 0|1|2|3

    // Check not locked
    const winner = await xataFindOne<{ value: string }>('settings', { key: 'winner_id' })
    if (winner?.value) {
      return NextResponse.json({ error: 'Voting is locked' }, { status: 403 })
    }

    const idea = await xataGet<IdeaRecord>('ideas', idea_id)
    if (!idea) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const scores = { ...(idea.scores ?? {}) }

    if (value === 0) {
      const personScores = { ...(scores[person] ?? {}) }
      delete personScores[criteria]

      if (Object.keys(personScores).length === 0) {
        delete scores[person]
      } else {
        scores[person] = personScores
      }
    } else {
      scores[person] = { ...(scores[person] ?? {}), [criteria]: value }
    }

    const updated = await xataUpdate('ideas', idea_id, { scores })
    return NextResponse.json(updated)
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
