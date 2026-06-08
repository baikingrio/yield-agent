import type {
  AppSettings,
  AppState,
  LogEntry,
  Pact,
  Strategy,
  WalletPreparation,
  WalletSummary,
  YieldPoint,
} from '../../shared/types/app'
import { createInitialState } from '../fixtures/initial-state'
import { loadPersistedSession } from '../utils/app-state-persistence'
import { stripDemoSeedData } from '../utils/strip-demo-seed'
import { stripLegacyPrepFixtures } from '../utils/strip-legacy-prep'
import { getDatabase } from './client'

const BLOB_KEYS = ['wallet', 'wallet_preparation', 'settings', 'yield_series_7d', 'yield_series_30d'] as const

function readBlob<T>(key: string, fallback: T): T {
  const row = getDatabase().prepare('SELECT value FROM kv_blob WHERE key = ?').get(key) as
    | { value: string }
    | undefined
  if (!row?.value) return fallback
  try {
    return JSON.parse(row.value) as T
  } catch {
    return fallback
  }
}

function writeBlob(key: string, value: unknown): void {
  getDatabase()
    .prepare('INSERT INTO kv_blob (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value')
    .run(key, JSON.stringify(value))
}

function readRows<T>(table: 'strategies' | 'pacts' | 'execution_logs'): T[] {
  const rows = getDatabase().prepare(`SELECT data FROM ${table}`).all() as Array<{ data: string }>
  return rows
    .map((row) => {
      try {
        return JSON.parse(row.data) as T
      } catch {
        return null
      }
    })
    .filter((item): item is T => item !== null)
}

function replaceRows<T extends { id: string }>(
  table: 'strategies' | 'pacts' | 'execution_logs',
  items: T[],
): void {
  const db = getDatabase()
  db.exec('BEGIN')
  try {
    db.exec(`DELETE FROM ${table}`)
    const stmt = db.prepare(`INSERT INTO ${table} (id, data) VALUES (?, ?)`)
    for (const item of items) {
      stmt.run(item.id, JSON.stringify(item))
    }
    db.exec('COMMIT')
  } catch (err) {
    db.exec('ROLLBACK')
    throw err
  }
}

export function isDatabaseInitialized(): boolean {
  const row = getDatabase().prepare('SELECT COUNT(*) AS count FROM kv_blob').get() as { count: number }
  return row.count > 0
}

export function loadStateFromDatabase(): AppState | null {
  if (!isDatabaseInitialized()) return null

  const seed = createInitialState()
  return {
    wallet: readBlob<WalletSummary>('wallet', seed.wallet),
    walletPreparation: readBlob<WalletPreparation>('wallet_preparation', seed.walletPreparation),
    settings: readBlob<AppSettings>('settings', seed.settings),
    strategies: readRows<Strategy>('strategies'),
    pacts: readRows<Pact>('pacts'),
    logs: readRows<LogEntry>('execution_logs'),
    yieldSeries7d: readBlob<YieldPoint[]>('yield_series_7d', seed.yieldSeries7d),
    yieldSeries30d: readBlob<YieldPoint[]>('yield_series_30d', seed.yieldSeries30d),
    yieldSnapshotLastSuppliedUsdc: readBlob<number | null>(
      'yield_snapshot_last_supplied',
      seed.yieldSnapshotLastSuppliedUsdc ?? null,
    ),
  }
}

function importLegacyJsonSession(state: AppState): AppState {
  const legacy = loadPersistedSession()
  if (!legacy) return state
  return {
    ...state,
    walletPreparation: legacy.walletPreparation,
    settings: { ...state.settings, ...legacy.settings },
    wallet: { ...state.wallet, ...legacy.wallet },
  }
}

export function hydrateInitialState(): AppState {
  const fromDb = loadStateFromDatabase()
  if (fromDb) {
    let state = fromDb
    let dirty = false

    const seedStrip = stripDemoSeedData(state)
    state = seedStrip.state
    if (seedStrip.changed) {
      dirty = true
      for (const pactId of seedStrip.removedPactIds) {
        deletePactCredential(pactId)
      }
    }

    const prepStrip = stripLegacyPrepFixtures(state)
    state = prepStrip.state
    if (prepStrip.changed) dirty = true

    if (dirty) saveStateToDatabase(state)
    return state
  }

  let state = createInitialState()
  state = importLegacyJsonSession(state)
  saveStateToDatabase(state)
  return state
}

export function saveStateToDatabase(state: AppState): void {
  writeBlob('wallet', state.wallet)
  writeBlob('wallet_preparation', state.walletPreparation)
  writeBlob('settings', state.settings)
  writeBlob('yield_series_7d', state.yieldSeries7d)
  writeBlob('yield_series_30d', state.yieldSeries30d)
  writeBlob('yield_snapshot_last_supplied', state.yieldSnapshotLastSuppliedUsdc ?? null)
  replaceRows('strategies', state.strategies)
  replaceRows('pacts', state.pacts)
  replaceRows('execution_logs', state.logs)
}

export function storePactCredential(pactId: string, apiKey: string): void {
  getDatabase()
    .prepare(
      'INSERT INTO pact_credentials (pact_id, api_key, stored_at) VALUES (?, ?, ?) ON CONFLICT(pact_id) DO UPDATE SET api_key = excluded.api_key, stored_at = excluded.stored_at',
    )
    .run(pactId, apiKey, new Date().toISOString())
}

export function getPactCredential(pactId: string): string | null {
  const row = getDatabase().prepare('SELECT api_key FROM pact_credentials WHERE pact_id = ?').get(pactId) as
    | { api_key: string }
    | undefined
  return row?.api_key?.trim() || null
}

export function deletePactCredential(pactId: string): void {
  getDatabase().prepare('DELETE FROM pact_credentials WHERE pact_id = ?').run(pactId)
}

export function clearDatabase(): void {
  const db = getDatabase()
  db.exec(`
    DELETE FROM strategies;
    DELETE FROM pacts;
    DELETE FROM execution_logs;
    DELETE FROM kv_blob;
    DELETE FROM pact_credentials;
  `)
}
