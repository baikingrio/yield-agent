import { existsSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { initSchema } from './schema'

let database: DatabaseSync | null = null

export function getDatabasePath(): string {
  return process.env.DATABASE_PATH?.trim() || join(process.cwd(), '.data', 'yieldagent.db')
}

export function getDatabase(): DatabaseSync {
  if (!database) {
    const path = getDatabasePath()
    if (path !== ':memory:') {
      const dir = dirname(path)
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
    }
    database = new DatabaseSync(path)
    initSchema(database)
  }
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
