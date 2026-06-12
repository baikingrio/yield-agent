import type { DatabaseSync } from 'node:sqlite'
import type postgres from 'postgres'

export const SCHEMA_VERSION = 1

export function initSchema(db: DatabaseSync): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS strategies (
      id TEXT PRIMARY KEY,
      data TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS pacts (
      id TEXT PRIMARY KEY,
      data TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS execution_logs (
      id TEXT PRIMARY KEY,
      data TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS kv_blob (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS pact_credentials (
      pact_id TEXT PRIMARY KEY,
      api_key TEXT NOT NULL,
      stored_at TEXT NOT NULL
    );
  `)

  const row = db.prepare('SELECT value FROM meta WHERE key = ?').get('schema_version') as
    | { value: string }
    | undefined

  if (!row) {
    db.prepare('INSERT INTO meta (key, value) VALUES (?, ?)').run(
      'schema_version',
      String(SCHEMA_VERSION),
    )
  }
}

export async function initPostgresSchema(sql: ReturnType<typeof postgres>): Promise<void> {
  const rows = await sql<{ ready: boolean }[]>`
    SELECT to_regclass('public.kv_blob') IS NOT NULL AS ready
  `
  if (rows[0]?.ready) {
    await sql`
      INSERT INTO meta (key, value)
      VALUES ('schema_version', ${String(SCHEMA_VERSION)})
      ON CONFLICT (key) DO NOTHING
    `
    return
  }

  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS strategies (
      id TEXT PRIMARY KEY,
      data JSONB NOT NULL
    );

    CREATE TABLE IF NOT EXISTS pacts (
      id TEXT PRIMARY KEY,
      data JSONB NOT NULL
    );

    CREATE TABLE IF NOT EXISTS execution_logs (
      id TEXT PRIMARY KEY,
      data JSONB NOT NULL
    );

    CREATE TABLE IF NOT EXISTS kv_blob (
      key TEXT PRIMARY KEY,
      value JSONB NOT NULL
    );

    CREATE TABLE IF NOT EXISTS pact_credentials (
      pact_id TEXT PRIMARY KEY,
      api_key TEXT NOT NULL,
      stored_at TEXT NOT NULL
    );
  `)

  await sql`
    INSERT INTO meta (key, value)
    VALUES ('schema_version', ${String(SCHEMA_VERSION)})
    ON CONFLICT (key) DO NOTHING
  `
}
