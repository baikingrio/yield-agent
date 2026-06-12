import postgres from 'postgres'
import { initPostgresSchema } from './schema'

let sql: ReturnType<typeof postgres> | null = null
let schemaReady: Promise<void> | null = null

export function getPostgresUrl(): string | null {
  const url = process.env.DATABASE_URL?.trim()
  return url || null
}

export function getSql(): ReturnType<typeof postgres> {
  const url = getPostgresUrl()
  if (!url) {
    throw new Error('DATABASE_URL is not configured')
  }

  if (!sql) {
    sql = postgres(url, {
      max: 1,
      ssl: 'require',
      prepare: false,
      connect_timeout: 10,
      idle_timeout: 20,
      onnotice: () => {},
    })
  }

  return sql
}

export async function ensurePostgresSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = initPostgresSchema(getSql())
  }
  await schemaReady
}

export async function closePostgres(): Promise<void> {
  if (sql) {
    await sql.end({ timeout: 5 })
    sql = null
    schemaReady = null
  }
}

export function resetPostgresConnection(): void {
  void closePostgres()
}
