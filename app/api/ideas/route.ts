// app/api/ideas/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { xataQuery, xataCreate, xataFindOne } from '@/lib/xata'

export interface IdeaRecord {
  id: string
  title: string
  description: string
  // scores: { A: { impact, feasibility, demo, relevance }, B: {...}, C: {...} }
  scores: Record<string, Record<string, number>>
  problem_statement: string
  created_at: string
}

export async function GET() {
  try {
    const ideas = await xataQuery<IdeaRecord>('ideas', {}, [{ column: 'xata.createdAt', direction: 'asc' }])
    const settings = await xataFindOne<{ value: string }>('settings', { key: 'winner_id' })
    return NextResponse.json({ ideas, winner_id: settings?.value ?? null })
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { title, description } = await req.json()
    if (!title?.trim()) return NextResponse.json({ error: 'Title required' }, { status: 400 })
    const idea = await xataCreate<IdeaRecord>('ideas', {
      title: title.trim(),
      description: description?.trim() ?? '',
      scores: {},
      problem_statement: '',
    })
    return NextResponse.json(idea)
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
