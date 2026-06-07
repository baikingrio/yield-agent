import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import type { DemoState, WalletPreparation } from '../../shared/types/demo'
import { saveStateToDatabase } from '../db/repository'

const STATE_FILE = join(process.cwd(), '.data', 'demo-session.json')

interface PersistedSession {
  walletPreparation: WalletPreparation
  settings: DemoState['settings']
  wallet: DemoState['wallet']
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

export function schedulePersistDemoState(state: DemoState): void {
  if (persistTimer) clearTimeout(persistTimer)
  persistTimer = setTimeout(() => {
    persistTimer = null
    try {
      saveStateToDatabase(state)
    } catch {
      // Best-effort persistence; ignore write failures in dev.
    }
  }, 200)
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
