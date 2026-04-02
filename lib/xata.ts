// lib/xata.ts
// Direct Xata REST API wrapper — no SDK or codegen required.
// Set XATA_API_KEY and XATA_DB_URL in .env.local

const API_KEY = process.env.XATA_API_KEY!
const DB_URL  = process.env.XATA_DB_URL!   // e.g. https://workspace.region.xata.sh/db/hackathon-hub:main

function headers() {
  return {
    Authorization: `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
  }
}

// ── Generic query (POST /tables/{table}/query) ─────────────────────────────
export async function xataQuery<T>(
  table: string,
  filter?: Record<string, unknown>,
  sort?: { column: string; direction?: 'asc' | 'desc' }[],
  size = 100
): Promise<T[]> {
  const res = await fetch(`${DB_URL}/tables/${table}/query`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ filter: filter ?? {}, sort: sort ?? [], page: { size } }),
    cache: 'no-store',
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`[xata query:${table}] ${res.status}: ${text}`)
  }
  const json = await res.json()
  return (json.records ?? []) as T[]
}

// ── Get by ID (GET /tables/{table}/{id}) ───────────────────────────────────
export async function xataGet<T>(table: string, id: string): Promise<T | null> {
  const res = await fetch(`${DB_URL}/tables/${table}/${id}`, {
    headers: headers(),
    cache: 'no-store',
  })
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`[xata get:${table}/${id}] ${res.status}`)
  return res.json() as Promise<T>
}

// ── Create (POST /tables/{table}) ─────────────────────────────────────────
export async function xataCreate<T>(table: string, record: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${DB_URL}/tables/${table}`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(record),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`[xata create:${table}] ${res.status}: ${text}`)
  }
  return res.json() as Promise<T>
}

// ── Update/patch (PATCH /tables/{table}/{id}) ──────────────────────────────
export async function xataUpdate<T>(
  table: string,
  id: string,
  patch: Record<string, unknown>
): Promise<T> {
  const res = await fetch(`${DB_URL}/tables/${table}/${id}`, {
    method: 'PATCH',
    headers: headers(),
    body: JSON.stringify(patch),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`[xata update:${table}/${id}] ${res.status}: ${text}`)
  }
  return res.json() as Promise<T>
}

// ── Delete (DELETE /tables/{table}/{id}) ──────────────────────────────────
export async function xataDelete(table: string, id: string): Promise<void> {
  const res = await fetch(`${DB_URL}/tables/${table}/${id}`, {
    method: 'DELETE',
    headers: headers(),
  })
  if (!res.ok && res.status !== 404) {
    throw new Error(`[xata delete:${table}/${id}] ${res.status}`)
  }
}

// ── Convenience: find one record matching a filter ────────────────────────
export async function xataFindOne<T>(
  table: string,
  filter: Record<string, unknown>
): Promise<T | null> {
  const records = await xataQuery<T>(table, filter, [], 1)
  return records[0] ?? null
}

// ── Upsert by a unique field (e.g. slug, key) ─────────────────────────────
export async function xataUpsert<T>(
  table: string,
  uniqueField: string,
  uniqueValue: string,
  data: Record<string, unknown>
): Promise<T> {
  const existing = await xataFindOne<{ id: string }>(table, { [uniqueField]: uniqueValue })
  if (existing) {
    return xataUpdate<T>(table, existing.id, data)
  }
  return xataCreate<T>(table, { [uniqueField]: uniqueValue, ...data })
}
