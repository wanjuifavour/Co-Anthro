// app/api/ideas/lock/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { xataUpsert, xataUpdate, xataFindOne } from '@/lib/xata'

export async function POST(req: NextRequest) {
  try {
    const { winner_id, problem_statement } = await req.json()
    if (!winner_id) return NextResponse.json({ error: 'winner_id required' }, { status: 400 })

    // Check not already locked
    const existing = await xataFindOne<{ value: string }>('settings', { key: 'winner_id' })
    if (existing?.value) {
      return NextResponse.json({ error: 'Already locked' }, { status: 409 })
    }

    // Save winner in settings
    await xataUpsert('settings', 'key', 'winner_id', { value: winner_id })

    // Save problem statement on the idea
    if (problem_statement) {
      await xataUpdate('ideas', winner_id, { problem_statement: problem_statement.trim() })
    }

    return NextResponse.json({ ok: true })
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

// PATCH — update problem statement after lock
export async function PATCH(req: NextRequest) {
  try {
    const { winner_id, problem_statement } = await req.json()
    if (!winner_id || !problem_statement) {
      return NextResponse.json({ error: 'winner_id and problem_statement required' }, { status: 400 })
    }
    await xataUpdate('ideas', winner_id, { problem_statement: problem_statement.trim() })
    return NextResponse.json({ ok: true })
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
