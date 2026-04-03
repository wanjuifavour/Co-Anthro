const MAX_AGE = 60 * 60 * 24 * 7 // 7 days
const TOKEN_VERSION = 'v1'

function getAuthSecret() {
    const secret = process.env.AUTH_SECRET

    if (!secret) {
        throw new Error('AUTH_SECRET is required')
    }

    return secret
}

function toBase64Url(bytes: Uint8Array) {
    let binary = ''
    for (let index = 0; index < bytes.length; index += 1) {
        binary += String.fromCharCode(bytes[index])
    }
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function fromBase64Url(value: string) {
    const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4)
    const binary = atob(padded)
    const bytes = new Uint8Array(binary.length)
    for (let index = 0; index < binary.length; index += 1) {
        bytes[index] = binary.charCodeAt(index)
    }
    return bytes
}

async function hmac(data: string) {
    const secret = getAuthSecret()
    const key = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign', 'verify']
    )

    return crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data))
}

export async function createAuthToken() {
    const payload = {
        v: TOKEN_VERSION,
        exp: Date.now() + MAX_AGE * 1000,
    }
    const payloadText = JSON.stringify(payload)
    const signature = await hmac(payloadText)
    return `${toBase64Url(new TextEncoder().encode(payloadText))}.${toBase64Url(new Uint8Array(signature))}`
}

export async function verifyAuthToken(token: string | undefined | null) {
    if (!token) return false

    const [encodedPayload, encodedSignature] = token.split('.')
    if (!encodedPayload || !encodedSignature) return false

    const payloadText = new TextDecoder().decode(fromBase64Url(encodedPayload))
    let payload: { v?: string; exp?: number }

    try {
        payload = JSON.parse(payloadText)
    } catch {
        return false
    }

    if (payload.v !== TOKEN_VERSION || typeof payload.exp !== 'number' || payload.exp < Date.now()) {
        return false
    }

    const expectedSignature = new Uint8Array(await hmac(payloadText))
    const actualSignature = fromBase64Url(encodedSignature)

    if (expectedSignature.length !== actualSignature.length) return false

    let mismatch = 0
    for (let index = 0; index < expectedSignature.length; index += 1) {
        mismatch |= expectedSignature[index] ^ actualSignature[index]
    }

    return mismatch === 0
}