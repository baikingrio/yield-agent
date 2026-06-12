import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import type { AppState, WalletPreparation } from '../../shared/types/app'
import { isPostgresBackend } from '../db/client'
import { saveStateToDatabase, saveStateToDatabaseAsync } from '../db/repository'

const STATE_FILE = join(process.cwd(), '.data', 'app-session.json')

interface PersistedSession {
  walletPreparation: WalletPreparation
  settings: AppState['settings']
  wallet: AppState['wallet']
}

let persistTimer: ReturnType<typeof setTimeout> | null = null

function ensureDataDir(): void {
  const dir = dirname(STATE_FILE)
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
}

export function loadPersistedSession(): PersistedSession | null {
  try {
    if (!existsSync(STATE_FILE)) return null
    const raw = readFileSync(STATE_FILE, 'utf8').trim()
    if (!raw) return null
    const parsed = JSON.parse(raw) as PersistedSession
    if (!parsed?.walletPreparation || !parsed?.settings) return null
    return parsed
  } catch {
    return null
  }
}

function writeAppState(state: AppState): void {
  try {
    saveStateToDatabase(state)
  } catch {
    // Best-effort persistence; ignore write failures in dev.
  }
}

export function schedulePersistAppState(state: AppState): void {
  // Vitest 单测中的 touchPreparation 不应污染本地 .data/yieldagent.db
  if (process.env.VITEST) return

  if (persistTimer) clearTimeout(persistTimer)
  persistTimer = setTimeout(() => {
    persistTimer = null
    writeAppState(state)
  }, 200)
}

export function flushPersistAppState(state: AppState): void {
  if (process.env.VITEST) return
  if (persistTimer) {
    clearTimeout(persistTimer)
    persistTimer = null
  }
  writeAppState(state)
}

export async function flushPersistAppStateAsync(state: AppState): Promise<void> {
  if (process.env.VITEST) return
  if (persistTimer) {
    clearTimeout(persistTimer)
    persistTimer = null
  }
  try {
    if (isPostgresBackend()) {
      await saveStateToDatabaseAsync(state)
    } else {
      saveStateToDatabase(state)
    }
  } catch {
    // Best-effort persistence; ignore write failures in dev.
  }
}

export function clearPersistedSession(): void {
  try {
    if (existsSync(STATE_FILE)) {
      writeFileSync(STATE_FILE, '', 'utf8')
    }
  } catch {
    // ignore
  }
}
