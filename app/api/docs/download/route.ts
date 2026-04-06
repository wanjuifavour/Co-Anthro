import { NextRequest, NextResponse } from 'next/server'
import fs from 'node:fs/promises'
import path from 'node:path'

const VALID_SLUGS = ['persona', 'user-journey', 'prd', 'tech-stack', 'ai-prompt', 'competitive', 'tana-buddy-spec']
const DOCS_DIRECTORY = path.join(process.cwd(), 'docs')
const PDF_FILES_BY_SLUG: Record<string, string> = {
    'tana-buddy-spec': 'Tana-buddy.pdf',
}

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
    try {
        const slug = req.nextUrl.searchParams.get('slug') ?? ''
        if (!VALID_SLUGS.includes(slug)) {
            return NextResponse.json({ error: 'Invalid slug' }, { status: 400 })
        }

        const fileName = PDF_FILES_BY_SLUG[slug]
        if (!fileName) {
            return NextResponse.json({ error: 'No uploaded PDF configured for this slug' }, { status: 404 })
        }

        const filePath = path.join(DOCS_DIRECTORY, fileName)

        let pdfBuffer: Buffer
        try {
            pdfBuffer = await fs.readFile(filePath)
        } catch (error: unknown) {
            const code = (error as NodeJS.ErrnoException)?.code
            if (code === 'ENOENT') {
                return NextResponse.json(
                    { error: `Uploaded file not found in docs folder: ${fileName}` },
                    { status: 404 },
                )
            }
            throw error
        }

        return new NextResponse(new Uint8Array(pdfBuffer), {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${fileName}"`,
                'Cache-Control': 'no-store',
            },
        })
    } catch (e: unknown) {
        return NextResponse.json({ error: String(e) }, { status: 500 })
    }
}
