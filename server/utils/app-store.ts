import type { AppState } from '../../shared/types/app'
import { createInitialState } from '../fixtures/initial-state'
import { hydrateInitialState, saveStateToDatabase } from '../db/repository'
import { schedulePersistAppState } from './app-state-persistence'

let state: AppState = hydrateInitialState()

export function getState(): AppState {
  return state
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
