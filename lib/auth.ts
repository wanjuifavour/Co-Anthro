// lib/auth.ts
import { cookies } from 'next/headers'

const COOKIE_NAME = 'hub_auth'
const COOKIE_VALUE = 'authenticated'
const MAX_AGE = 60 * 60 * 24 * 7 // 7 days

export function setAuthCookie() {
  cookies().set(COOKIE_NAME, COOKIE_VALUE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: MAX_AGE,
    path: '/',
  })
}

export function clearAuthCookie() {
  cookies().delete(COOKIE_NAME)
}

export function isAuthenticated(): boolean {
  return cookies().get(COOKIE_NAME)?.value === COOKIE_VALUE
}

export function checkPassword(input: string): boolean {
  return input === process.env.TEAM_PASSWORD
}
