// app/api/docs/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { xataQuery, xataUpsert } from '@/lib/xata'

const VALID_SLUGS = ['persona', 'user-journey', 'prd', 'tech-stack', 'ai-prompt', 'competitive']

interface DocRecord {
  id: string
  slug: string
  content: string
  updated_by: string
  updated_at: string
}

export async function GET() {
  try {
    const docs = await xataQuery<DocRecord>('documents', {}, [], 20)
    const map: Record<string, { content: string; updated_by: string; updated_at: string }> = {}
    for (const d of docs) {
      map[d.slug] = { content: d.content, updated_by: d.updated_by, updated_at: d.updated_at }
    }
    return NextResponse.json(map)
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { slug, content, updated_by } = await req.json()
    if (!slug || !VALID_SLUGS.includes(slug)) {
      return NextResponse.json({ error: 'Invalid slug' }, { status: 400 })
    }
    const doc = await xataUpsert('documents', 'slug', slug, {
      content: content ?? '',
      updated_by: updated_by ?? 'team',
      updated_at: new Date().toISOString(),
    })
    return NextResponse.json(doc)
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
