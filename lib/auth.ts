// lib/auth.ts
import { cookies } from 'next/headers'
import { createAuthToken, verifyAuthToken } from '@/lib/auth-token'

const COOKIE_NAME = 'hub_auth'
const MAX_AGE = 60 * 60 * 24 * 7 // 7 days

export async function setAuthCookie() {
  const cookieStore = await cookies()
  const token = await createAuthToken()

  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: MAX_AGE,
    path: '/',
  })
}

export async function clearAuthCookie() {
  const cookieStore = await cookies()

  cookieStore.delete(COOKIE_NAME)
}

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value

  return verifyAuthToken(token)
}

export function checkPassword(input: string): boolean {
  return input === process.env.TEAM_PASSWORD
}
