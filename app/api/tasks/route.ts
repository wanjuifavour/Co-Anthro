// app/api/tasks/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { xataQuery, xataUpsert } from '@/lib/xata'

interface TaskRecord {
  id: string
  task_key: string // e.g. "3-1" (dayIndex-taskIndex)
  checked: boolean
  checked_by: string
  checked_at: string
}

export async function GET() {
  try {
    const records = await xataQuery<TaskRecord>('tasks', {}, [], 500)
    // Return as a map: { "0-0": { checked, checked_by, checked_at }, ... }
    const map: Record<string, { checked: boolean; checked_by: string; checked_at: string }> = {}
    for (const r of records) {
      map[r.task_key] = { checked: r.checked, checked_by: r.checked_by, checked_at: r.checked_at }
    }
    return NextResponse.json(map)
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { task_key, checked, checked_by } = await req.json()
    if (!task_key || typeof checked !== 'boolean') {
      return NextResponse.json({ error: 'task_key and checked required' }, { status: 400 })
    }
    const record = await xataUpsert('tasks', 'task_key', task_key, {
      checked,
      checked_by: checked_by ?? 'team',
      checked_at: new Date().toISOString(),
    })
    return NextResponse.json(record)
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
