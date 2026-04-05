// app/api/ideas/lock/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { xataUpsert, xataUpdate, xataFindOne, xataGet } from '@/lib/xata'

export async function POST(req: NextRequest) {
  try {
    const { winner_id, problem_statement, replace_existing } = await req.json()
    if (!winner_id) return NextResponse.json({ error: 'winner_id required' }, { status: 400 })

    const winnerIdea = await xataGet<{ id: string }>('ideas', winner_id)
    if (!winnerIdea?.id) {
      return NextResponse.json({ error: 'winner idea not found' }, { status: 404 })
    }

    // Check already locked
    const existing = await xataFindOne<{ value: string }>('settings', { key: 'winner_id' })
    if (existing?.value && existing.value !== winner_id && !replace_existing) {
      return NextResponse.json({ error: 'Already locked' }, { status: 409 })
    }

    // Save/replace winner in settings
    await xataUpsert('settings', 'key', 'winner_id', { value: winner_id })

    // Save problem statement on the idea
    if (problem_statement) {
      await xataUpdate('ideas', winner_id, { problem_statement: problem_statement.trim() })
    }

    return NextResponse.json({
      ok: true,
      replaced_previous: Boolean(existing?.value && existing.value !== winner_id),
      previous_winner_id: existing?.value ?? null,
      winner_id,
    })
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
