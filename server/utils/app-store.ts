import type { AppState } from '../../shared/types/app'
import { createInitialState } from '../fixtures/initial-state'
import { hydrateInitialState, hydrateInitialStateAsync, saveStateToDatabase } from '../db/repository'
import { isPostgresBackend } from '../db/client'
import { flushPersistAppState, flushPersistAppStateAsync, schedulePersistAppState } from './app-state-persistence'

const POSTGRES_HYDRATE_TIMEOUT_MS = 10_000

let state: AppState = hydrateInitialState()
let postgresReady = !isPostgresBackend()
let postgresInitPromise: Promise<void> | null = null

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`${label} timed out after ${ms}ms`))
    }, ms)
    promise.then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      (err) => {
        clearTimeout(timer)
        reject(err)
      },
    )
  })
}

export function getState(): AppState {
  return state
}

export function replaceAppState(next: AppState): void {
  state = next
}

export async function ensureAppStoreHydrated(): Promise<void> {
  if (postgresReady) return
  if (!postgresInitPromise) {
    postgresInitPromise = (async () => {
      try {
        const next = await withTimeout(
          hydrateInitialStateAsync(),
          POSTGRES_HYDRATE_TIMEOUT_MS,
          'Postgres hydrate',
        )
        state = next
      } catch (err) {
        console.warn('[yield-agent] Postgres hydrate failed; continuing with in-memory state.', err)
        state = createInitialState()
      } finally {
        postgresReady = true
      }
    })()
  }
  await postgresInitPromise
}

export function resetState(): void {
  state = createInitialState()
  saveStateToDatabase(state)
}

export function setState(next: AppState): void {
  state = next
  schedulePersistAppState(state)
}

export function persistCurrentState(): void {
  schedulePersistAppState(state)
}

export function flushCurrentState(): void {
  flushPersistAppState(state)
}

export async function flushCurrentStateAsync(): Promise<void> {
  await flushPersistAppStateAsync(state)
}
