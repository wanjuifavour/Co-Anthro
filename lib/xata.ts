// lib/xata.ts
// PostgreSQL wrapper for Xata's Postgres endpoint.

import { Pool } from 'pg'

const DB_URL = process.env.XATA_DB_URL

if (!DB_URL) {
  throw new Error('XATA_DB_URL is required')
}

function normalizeConnectionString(connectionString: string) {
  const url = new URL(connectionString)
  const sslMode = url.searchParams.get('sslmode')

  if (sslMode === 'require') {
    url.searchParams.set('sslmode', 'verify-full')
  }

  return url.toString()
}

declare global {
  // eslint-disable-next-line no-var
  var __xataPgPool: Pool | undefined
}

const pool = globalThis.__xataPgPool ?? new Pool({
  connectionString: normalizeConnectionString(DB_URL),
})

if (!globalThis.__xataPgPool) {
  globalThis.__xataPgPool = pool
}

type Sort = { column: string; direction?: 'asc' | 'desc' }

function normalizeColumn(column: string) {
  if (column === 'xata.createdAt') return 'created_at'
  if (column === 'xata.updatedAt') return 'updated_at'
  return column
}

function quoteIdent(ident: string) {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(ident)) {
    throw new Error(`Invalid identifier: ${ident}`)
  }
  return `"${ident}"`
}

function buildWhere(filter?: Record<string, unknown>) {
  if (!filter || Object.keys(filter).length === 0) {
    return { whereSql: '', values: [] as unknown[] }
  }

  const clauses: string[] = []
  const values: unknown[] = []

  for (const [rawColumn, value] of Object.entries(filter)) {
    const column = quoteIdent(normalizeColumn(rawColumn))
    if (value === undefined) continue
    if (value === null) {
      clauses.push(`${column} IS NULL`)
      continue
    }

    values.push(value)
    clauses.push(`${column} = $${values.length}`)
  }

  if (clauses.length === 0) {
    return { whereSql: '', values }
  }

  return { whereSql: ` WHERE ${clauses.join(' AND ')}`, values }
}

function buildOrderBy(sort?: Sort[]) {
  if (!sort || sort.length === 0) return ''

  const parts = sort.map(s => {
    const column = quoteIdent(normalizeColumn(s.column))
    const direction = s.direction?.toLowerCase() === 'desc' ? 'DESC' : 'ASC'
    return `${column} ${direction}`
  })

  return ` ORDER BY ${parts.join(', ')}`
}

export async function xataQuery<T>(
  table: string,
  filter?: Record<string, unknown>,
  sort?: Sort[],
  size = 100
): Promise<T[]> {
  const tableName = quoteIdent(table)
  const { whereSql, values } = buildWhere(filter)
  const orderBy = buildOrderBy(sort)
  const limit = Number.isFinite(size) && size > 0 ? Math.floor(size) : 100

  const sql = `SELECT * FROM ${tableName}${whereSql}${orderBy} LIMIT $${values.length + 1}`
  const result = await pool.query(sql, [...values, limit])
  return result.rows as T[]
}

export async function xataGet<T>(table: string, id: string): Promise<T | null> {
  const tableName = quoteIdent(table)
  const sql = `SELECT * FROM ${tableName} WHERE "id" = $1 LIMIT 1`
  const result = await pool.query(sql, [id])
  return (result.rows[0] as T | undefined) ?? null
}

export async function xataCreate<T>(table: string, record: Record<string, unknown>): Promise<T> {
  const tableName = quoteIdent(table)
  const entries = Object.entries(record)

  if (entries.length === 0) {
    const sql = `INSERT INTO ${tableName} DEFAULT VALUES RETURNING *`
    const result = await pool.query(sql)
    return result.rows[0] as T
  }

  const columns = entries.map(([column]) => quoteIdent(normalizeColumn(column)))
  const placeholders = entries.map((_, index) => `$${index + 1}`)
  const values = entries.map(([, value]) => value)

  const sql = `
    INSERT INTO ${tableName} (${columns.join(', ')})
    VALUES (${placeholders.join(', ')})
    RETURNING *
  `

  const result = await pool.query(sql, values)
  return result.rows[0] as T
}

export async function xataUpdate<T>(
  table: string,
  id: string,
  patch: Record<string, unknown>
): Promise<T> {
  const tableName = quoteIdent(table)
  const entries = Object.entries(patch)

  if (entries.length === 0) {
    const existing = await xataGet<T>(table, id)
    if (!existing) throw new Error(`[xata update:${table}/${id}] not found`)
    return existing
  }

  const setClauses = entries.map(([column], index) => `${quoteIdent(normalizeColumn(column))} = $${index + 1}`)
  const values = entries.map(([, value]) => value)
  values.push(id)

  const sql = `
    UPDATE ${tableName}
    SET ${setClauses.join(', ')}
    WHERE "id" = $${values.length}
    RETURNING *
  `

  const result = await pool.query(sql, values)
  if (result.rowCount === 0) {
    throw new Error(`[xata update:${table}/${id}] not found`)
  }
  return result.rows[0] as T
}

export async function xataDelete(table: string, id: string): Promise<void> {
  const tableName = quoteIdent(table)
  const sql = `DELETE FROM ${tableName} WHERE "id" = $1`
  await pool.query(sql, [id])
}

export async function xataFindOne<T>(
  table: string,
  filter: Record<string, unknown>
): Promise<T | null> {
  const records = await xataQuery<T>(table, filter, [], 1)
  return records[0] ?? null
}

export async function xataUpsert<T>(
  table: string,
  uniqueField: string,
  uniqueValue: string,
  data: Record<string, unknown>
): Promise<T> {
  const existing = await xataFindOne<{ id: string }>(table, { [uniqueField]: uniqueValue })
  if (existing?.id) {
    return xataUpdate<T>(table, existing.id, data)
  }
  return xataCreate<T>(table, { [uniqueField]: uniqueValue, ...data })
}
