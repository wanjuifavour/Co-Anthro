// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { setAuthCookie, checkPassword } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const { password } = await req.json()

  if (!checkPassword(password)) {
    return NextResponse.json({ error: 'Wrong password' }, { status: 401 })
  }

  await setAuthCookie()
  return NextResponse.json({ ok: true })
}
