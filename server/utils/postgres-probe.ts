import { isPostgresBackend } from '../db/client'
import { ensurePostgresSchema, getSql } from '../db/postgres-client'

export async function probePostgresConnection(): Promise<boolean | null> {
  if (!isPostgresBackend()) return null
  try {
    await ensurePostgresSchema()
    const rows = await getSql()`SELECT 1::int AS ok`
    return rows[0]?.ok === 1
  } catch {
    return false
  }
}

export function isDatabaseUrlConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim())
}
