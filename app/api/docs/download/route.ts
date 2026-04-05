import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { xataFindOne } from '@/lib/xata'

const VALID_SLUGS = ['persona', 'user-journey', 'prd', 'tech-stack', 'ai-prompt', 'competitive', 'tana-buddy-spec']

interface DocRecord {
    slug: string
    content: string
    updated_by: string
    updated_at: string
}

function wrapLine(text: string, maxChars: number) {
    if (!text) return ['']

    const words = text.split(/\s+/)
    const lines: string[] = []
    let current = ''

    for (const word of words) {
        const candidate = current ? `${current} ${word}` : word
        if (candidate.length <= maxChars) {
            current = candidate
            continue
        }

        if (current) lines.push(current)

        if (word.length <= maxChars) {
            current = word
        } else {
            const chunks = word.match(new RegExp(`.{1,${maxChars}}`, 'g')) ?? [word]
            lines.push(...chunks.slice(0, -1))
            current = chunks[chunks.length - 1] ?? ''
        }
    }

    if (current) lines.push(current)
    return lines.length ? lines : ['']
}

function textToLines(content: string, maxChars = 95) {
    const lines: string[] = []
    const paragraphs = content.replace(/\r\n/g, '\n').split('\n')

    for (const paragraph of paragraphs) {
        if (!paragraph.trim()) {
            lines.push('')
            continue
        }
        lines.push(...wrapLine(paragraph, maxChars))
    }

    return lines
}

export async function GET(req: NextRequest) {
    try {
        const slug = req.nextUrl.searchParams.get('slug') ?? ''
        if (!VALID_SLUGS.includes(slug)) {
            return NextResponse.json({ error: 'Invalid slug' }, { status: 400 })
        }

        const doc = await xataFindOne<DocRecord>('documents', { slug })
        const content = (doc?.content ?? '').trim()

        if (!content) {
            return NextResponse.json({ error: 'No content to export' }, { status: 404 })
        }

        const pdf = await PDFDocument.create()
        const font = await pdf.embedFont(StandardFonts.Helvetica)

        const pageWidth = 595
        const pageHeight = 842
        const margin = 50
        const lineHeight = 15
        const fontSize = 11

        const lines = textToLines(content, 95)

        let page = pdf.addPage([pageWidth, pageHeight])
        let y = pageHeight - margin

        const title = `${slug} export`
        page.drawText(title, {
            x: margin,
            y,
            size: 13,
            font,
            color: rgb(0.15, 0.15, 0.15),
        })
        y -= lineHeight * 1.5

        for (const line of lines) {
            if (y <= margin) {
                page = pdf.addPage([pageWidth, pageHeight])
                y = pageHeight - margin
            }

            page.drawText(line, {
                x: margin,
                y,
                size: fontSize,
                font,
                color: rgb(0, 0, 0),
            })

            y -= lineHeight
        }

        const pdfBytes = await pdf.save()

        return new NextResponse(Buffer.from(pdfBytes), {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${slug}.pdf"`,
                'Cache-Control': 'no-store',
            },
        })
    } catch (e: unknown) {
        return NextResponse.json({ error: String(e) }, { status: 500 })
    }
}
