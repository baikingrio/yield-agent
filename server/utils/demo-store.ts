import type { DemoState } from '../../shared/types/demo'
import { createInitialState } from '../fixtures/initial-state'
import { hydrateInitialState, saveStateToDatabase } from '../db/repository'
import { schedulePersistDemoState } from './demo-state-persistence'

let state: DemoState = hydrateInitialState()

export function getState(): DemoState {
  return state
}

export function resetState(): void {
  state = createInitialState()
  saveStateToDatabase(state)
}

export function setState(next: DemoState): void {
  state = next
  schedulePersistDemoState(state)
}

export function persistCurrentState(): void {
  schedulePersistDemoState(state)
}
