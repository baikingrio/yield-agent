import { createRequire } from 'node:module'
import { existsSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import type { DatabaseSync } from 'node:sqlite'
import { initSchema } from './schema'

const require = createRequire(import.meta.url)

let database: DatabaseSync | null = null
let sqliteUnavailable = false

export type DatabaseBackend = 'sqlite' | 'postgres'

export function getDatabaseBackend(): DatabaseBackend {
  if (process.env.DATABASE_URL?.trim()) return 'postgres'
  return 'sqlite'
}

export function isPostgresBackend(): boolean {
  return getDatabaseBackend() === 'postgres'
}

export function isPersistentDatabase(): boolean {
  if (isPostgresBackend()) return true
  const path = getDatabasePath()
  return path !== ':memory:'
}

function loadDatabaseSyncCtor(): (new (path: string) => DatabaseSync) | null {
  if (sqliteUnavailable) return null
  try {
    return require('node:sqlite').DatabaseSync as new (path: string) => DatabaseSync
  } catch {
    sqliteUnavailable = true
    return null
  }
}

export function isSqliteAvailable(): boolean {
  return loadDatabaseSyncCtor() !== null
}

export function getDatabasePath(): string {
  const explicit = process.env.DATABASE_PATH?.trim()
  if (explicit) return explicit
  // Vercel Lambda: /var/task is read-only; persist under /tmp when unset.
  if (process.env.VERCEL === '1') return '/tmp/yieldagent.db'
  return join(process.cwd(), '.data', 'yieldagent.db')
}

export function getDatabase(): DatabaseSync {
  if (isPostgresBackend()) {
    throw new Error('getDatabase() is unavailable when DATABASE_URL is configured; use postgres client')
  }

  if (database) return database

  const DatabaseSyncCtor = loadDatabaseSyncCtor()
  if (!DatabaseSyncCtor) {
    throw new Error('SQLITE_UNAVAILABLE')
  }

  const path = getDatabasePath()
  if (path !== ':memory:') {
    const dir = dirname(path)
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  }
  database = new DatabaseSyncCtor(path)
  initSchema(database)
  return database
}

export function closeDatabase(): void {
  if (database) {
    database.close()
    database = null
  }
}

export function resetDatabaseConnection(): void {
  closeDatabase()
}
