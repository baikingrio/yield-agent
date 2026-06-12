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
import { normalizeAppStateNetworks } from '../../shared/constants/network'
import { createInitialState } from '../fixtures/initial-state'
import { loadPersistedSession } from '../utils/app-state-persistence'
import { stripLegacySeedData } from '../utils/strip-legacy-seed'
import { stripLegacyPrepFixtures } from '../utils/strip-legacy-prep'
import { applyPresetDemoWallet, getPresetDemoWalletConfig } from '../utils/pacttrader-demo-wallet'
import { getDatabase, getDatabaseBackend, isPostgresBackend } from './client'
import { closePostgres, ensurePostgresSchema, getSql } from './postgres-client'

type RowTable = 'strategies' | 'pacts' | 'execution_logs'

import {
  clearPactCredentialCache,
  deletePactCredentialFromCache,
  getPactCredentialFromCache,
  isPostgresHydrated,
  loadPactCredentialCache,
  resetRepositoryRuntimeState,
  setPactCredentialInCache,
  setPostgresHydrated,
} from './runtime-state'

function parseJsonValue<T>(raw: unknown, fallback: T): T {
  if (raw === null || raw === undefined) return fallback
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as T
    } catch {
      return fallback
    }
  }
  return raw as T
}

function readBlobSqlite<T>(key: string, fallback: T): T {
  const row = getDatabase().prepare('SELECT value FROM kv_blob WHERE key = ?').get(key) as
    | { value: string }
    | undefined
  if (!row?.value) return fallback
  return parseJsonValue(row.value, fallback)
}

function writeBlobSqlite(key: string, value: unknown): void {
  getDatabase()
    .prepare('INSERT INTO kv_blob (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value')
    .run(key, JSON.stringify(value))
}

function readRowsSqlite<T>(table: RowTable): T[] {
  const rows = getDatabase().prepare(`SELECT data FROM ${table}`).all() as Array<{ data: string }>
  return rows
    .map((row) => parseJsonValue<T>(row.data, null))
    .filter((item): item is T => item !== null)
}

function replaceRowsSqlite<T extends { id: string }>(table: RowTable, items: T[]): void {
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

async function readBlobPostgres<T>(key: string, fallback: T): Promise<T> {
  await ensurePostgresSchema()
  const rows = await getSql()`SELECT value FROM kv_blob WHERE key = ${key}`
  const raw = rows[0]?.value
  if (raw === null || raw === undefined) return fallback
  return parseJsonValue(raw, fallback)
}

async function writeBlobPostgres(key: string, value: unknown): Promise<void> {
  await ensurePostgresSchema()
  const sql = getSql()
  // sql.json(null) becomes SQL NULL; kv_blob.value is NOT NULL — store JSON null instead.
  const jsonValue = value === undefined || value === null
    ? sql`'null'::jsonb`
    : sql.json(value)
  await sql`
    INSERT INTO kv_blob (key, value)
    VALUES (${key}, ${jsonValue})
    ON CONFLICT (key) DO UPDATE SET value = excluded.value
  `
}

async function readRowsPostgres<T>(table: RowTable): Promise<T[]> {
  await ensurePostgresSchema()
  const sql = getSql()
  const rows = await (table === 'strategies'
    ? sql`SELECT data FROM strategies`
    : table === 'pacts'
      ? sql`SELECT data FROM pacts`
      : sql`SELECT data FROM execution_logs`)
  return rows
    .map((row) => parseJsonValue<T>(row.data, null))
    .filter((item): item is T => item !== null)
}

async function replaceRowsPostgres<T extends { id: string }>(table: RowTable, items: T[]): Promise<void> {
  await ensurePostgresSchema()
  const sql = getSql()
  await sql.begin(async (tx) => {
    if (table === 'strategies') {
      await tx`DELETE FROM strategies`
      if (items.length > 0) {
        await tx`INSERT INTO strategies ${tx(items.map((item) => ({ id: item.id, data: tx.json(item) })))}`
      }
      return
    }
    if (table === 'pacts') {
      await tx`DELETE FROM pacts`
      if (items.length > 0) {
        await tx`INSERT INTO pacts ${tx(items.map((item) => ({ id: item.id, data: tx.json(item) })))}`
      }
      return
    }
    await tx`DELETE FROM execution_logs`
    if (items.length > 0) {
      await tx`INSERT INTO execution_logs ${tx(items.map((item) => ({ id: item.id, data: tx.json(item) })))}`
    }
  })
}

async function loadPactCredentialCachePostgres(): Promise<void> {
  await ensurePostgresSchema()
  const rows = await getSql()`SELECT pact_id, api_key FROM pact_credentials`
  loadPactCredentialCache(
    rows.map((row) => ({ pactId: row.pact_id, apiKey: row.api_key })),
  )
}

function readBlob<T>(key: string, fallback: T): T {
  return readBlobSqlite(key, fallback)
}

function writeBlob(key: string, value: unknown): void {
  writeBlobSqlite(key, value)
}

function readRows<T>(table: RowTable): T[] {
  return readRowsSqlite<T>(table)
}

function replaceRows<T extends { id: string }>(table: RowTable, items: T[]): void {
  replaceRowsSqlite(table, items)
}

export function isDatabaseInitialized(): boolean {
  if (isPostgresBackend()) return isPostgresHydrated()
  const row = getDatabase().prepare('SELECT COUNT(*) AS count FROM kv_blob').get() as { count: number }
  return row.count > 0
}

export function loadStateFromDatabase(): AppState | null {
  if (isPostgresBackend()) {
    throw new Error('loadStateFromDatabase() is sync-only; use loadStateFromDatabaseAsync() with DATABASE_URL')
  }
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

export async function loadStateFromDatabaseAsync(): Promise<AppState | null> {
  if (!isPostgresBackend()) {
    return loadStateFromDatabase()
  }

  await ensurePostgresSchema()
  const countRows = await getSql()`SELECT COUNT(*)::int AS count FROM kv_blob`
  if ((countRows[0]?.count ?? 0) === 0) return null

  const seed = createInitialState()
  setPostgresHydrated(true)
  await loadPactCredentialCachePostgres()

  return {
    wallet: await readBlobPostgres<WalletSummary>('wallet', seed.wallet),
    walletPreparation: await readBlobPostgres<WalletPreparation>('wallet_preparation', seed.walletPreparation),
    settings: await readBlobPostgres<AppSettings>('settings', seed.settings),
    strategies: await readRowsPostgres<Strategy>('strategies'),
    pacts: await readRowsPostgres<Pact>('pacts'),
    logs: await readRowsPostgres<LogEntry>('execution_logs'),
    yieldSeries7d: await readBlobPostgres<YieldPoint[]>('yield_series_7d', seed.yieldSeries7d),
    yieldSeries30d: await readBlobPostgres<YieldPoint[]>('yield_series_30d', seed.yieldSeries30d),
    yieldSnapshotLastSuppliedUsdc: await readBlobPostgres<number | null>(
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

function finalizeHydratedState(state: AppState): AppState {
  let next = state
  let dirty = false

  const seedStrip = stripLegacySeedData(next)
  next = seedStrip.state
  if (seedStrip.changed) {
    dirty = true
    for (const pactId of seedStrip.removedPactIds) {
      deletePactCredential(pactId)
    }
  }

  const prepStrip = stripLegacyPrepFixtures(next)
  next = prepStrip.state
  if (prepStrip.changed) dirty = true

  const networkNorm = normalizeAppStateNetworks(next)
  next = networkNorm.state
  if (networkNorm.changed) dirty = true

  const demoConfig = getPresetDemoWalletConfig()
  if (demoConfig.enabled && !next.walletPreparation.ready) {
    const demoResult = applyPresetDemoWallet(next)
    next = demoResult.state
    if (demoResult.applied) dirty = true
  }

  if (dirty) {
    void saveStateToDatabaseAsync(next)
  }

  return next
}

export function hydrateInitialState(): AppState {
  if (isPostgresBackend()) {
    return createInitialState()
  }

  try {
    const fromDb = loadStateFromDatabase()
    if (fromDb) {
      return finalizeHydratedState(fromDb)
    }

    let state = createInitialState()
    state = importLegacyJsonSession(state)
    saveStateToDatabase(state)
    return state
  } catch (err) {
    console.warn('[yield-agent] SQLite unavailable; using ephemeral in-memory state.', err)
    return createInitialState()
  }
}

export async function hydrateInitialStateAsync(): Promise<AppState> {
  if (!isPostgresBackend()) {
    return hydrateInitialState()
  }

  try {
    const fromDb = await loadStateFromDatabaseAsync()
    if (fromDb) {
      return finalizeHydratedState(fromDb)
    }

    let state = createInitialState()
    state = importLegacyJsonSession(state)
    await saveStateToDatabaseAsync(state)
    return state
  } catch (err) {
    console.warn('[yield-agent] Postgres unavailable; using ephemeral in-memory state.', err)
    return createInitialState()
  }
}

export function saveStateToDatabase(state: AppState): void {
  if (isPostgresBackend()) {
    void saveStateToDatabaseAsync(state).catch((err) => {
      console.warn('[yield-agent] Postgres persist failed.', err)
    })
    return
  }

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

export async function saveStateToDatabaseAsync(state: AppState): Promise<void> {
  if (!isPostgresBackend()) {
    saveStateToDatabase(state)
    return
  }

  await writeBlobPostgres('wallet', state.wallet)
  await writeBlobPostgres('wallet_preparation', state.walletPreparation)
  await writeBlobPostgres('settings', state.settings)
  await writeBlobPostgres('yield_series_7d', state.yieldSeries7d)
  await writeBlobPostgres('yield_series_30d', state.yieldSeries30d)
  await writeBlobPostgres('yield_snapshot_last_supplied', state.yieldSnapshotLastSuppliedUsdc ?? null)
  await replaceRowsPostgres('strategies', state.strategies)
  await replaceRowsPostgres('pacts', state.pacts)
  await replaceRowsPostgres('execution_logs', state.logs)
  setPostgresHydrated(true)
}

export function storePactCredential(pactId: string, apiKey: string): void {
  const trimmed = apiKey.trim()
  setPactCredentialInCache(pactId, trimmed)

  if (isPostgresBackend()) {
    void storePactCredentialAsync(pactId, trimmed).catch((err) => {
      console.warn('[yield-agent] Postgres pact credential persist failed.', err)
    })
    return
  }

  getDatabase()
    .prepare(
      'INSERT INTO pact_credentials (pact_id, api_key, stored_at) VALUES (?, ?, ?) ON CONFLICT(pact_id) DO UPDATE SET api_key = excluded.api_key, stored_at = excluded.stored_at',
    )
    .run(pactId, trimmed, new Date().toISOString())
}

async function storePactCredentialAsync(pactId: string, apiKey: string): Promise<void> {
  await ensurePostgresSchema()
  const storedAt = new Date().toISOString()
  await getSql()`
    INSERT INTO pact_credentials (pact_id, api_key, stored_at)
    VALUES (${pactId}, ${apiKey}, ${storedAt})
    ON CONFLICT (pact_id) DO UPDATE
    SET api_key = excluded.api_key, stored_at = excluded.stored_at
  `
}

export function getPactCredential(pactId: string): string | null {
  const cached = getPactCredentialFromCache(pactId)
  if (cached) return cached

  if (isPostgresBackend()) {
    return null
  }

  const row = getDatabase().prepare('SELECT api_key FROM pact_credentials WHERE pact_id = ?').get(pactId) as
    | { api_key: string }
    | undefined
  const key = row?.api_key?.trim() || null
  if (key) setPactCredentialInCache(pactId, key)
  return key
}

export async function getPactCredentialAsync(pactId: string): Promise<string | null> {
  const cached = getPactCredentialFromCache(pactId)
  if (cached) return cached

  if (isPostgresBackend()) {
    await ensurePostgresSchema()
    const rows = await getSql()`SELECT api_key FROM pact_credentials WHERE pact_id = ${pactId}`
    const key = rows[0]?.api_key?.trim() || null
    if (key) setPactCredentialInCache(pactId, key)
    return key
  }

  return getPactCredential(pactId)
}

export function deletePactCredential(pactId: string): void {
  deletePactCredentialFromCache(pactId)

  if (isPostgresBackend()) {
    void deletePactCredentialAsync(pactId).catch((err) => {
      console.warn('[yield-agent] Postgres pact credential delete failed.', err)
    })
    return
  }

  getDatabase().prepare('DELETE FROM pact_credentials WHERE pact_id = ?').run(pactId)
}

async function deletePactCredentialAsync(pactId: string): Promise<void> {
  await ensurePostgresSchema()
  await getSql()`DELETE FROM pact_credentials WHERE pact_id = ${pactId}`
}

export function clearDatabase(): void {
  resetRepositoryRuntimeState()

  if (isPostgresBackend()) {
    void clearDatabaseAsync().catch((err) => {
      console.warn('[yield-agent] Postgres clear failed.', err)
    })
    return
  }

  const db = getDatabase()
  db.exec(`
    DELETE FROM strategies;
    DELETE FROM pacts;
    DELETE FROM execution_logs;
    DELETE FROM kv_blob;
    DELETE FROM pact_credentials;
  `)
}

export async function clearDatabaseAsync(): Promise<void> {
  await ensurePostgresSchema()
  const sql = getSql()
  await sql.begin(async (tx) => {
    await tx`DELETE FROM strategies`
    await tx`DELETE FROM pacts`
    await tx`DELETE FROM execution_logs`
    await tx`DELETE FROM kv_blob`
    await tx`DELETE FROM pact_credentials`
  })
  resetRepositoryRuntimeState()
}

export function getDatabaseBackendLabel(): 'postgres' | 'sqlite' | 'ephemeral' {
  if (isPostgresBackend()) return 'postgres'
  if (process.env.VERCEL === '1') return 'ephemeral'
  return 'sqlite'
}

export { getDatabaseBackend } from './client'
export { resetRepositoryRuntimeState } from './runtime-state'
