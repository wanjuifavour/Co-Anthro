// app/api/notes/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { xataQuery, xataCreate } from '@/lib/xata'

interface NoteRecord {
  id: string
  author: string
  content: string
  created_at: string
}

export async function GET() {
  try {
    const notes = await xataQuery<NoteRecord>(
      'notes',
      {},
      [{ column: 'xata.createdAt', direction: 'desc' }],
      200
    )
    return NextResponse.json(notes)
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { author, content } = await req.json()
    if (!content?.trim()) return NextResponse.json({ error: 'Content required' }, { status: 400 })
    if (!['A', 'B', 'C'].includes(author)) {
      return NextResponse.json({ error: 'Author must be A, B, or C' }, { status: 400 })
    }
    const note = await xataCreate<NoteRecord>('notes', {
      author,
      content: content.trim(),
      created_at: new Date().toISOString(),
    })
    return NextResponse.json(note)
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
