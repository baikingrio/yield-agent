import type { DemoState } from '../../shared/types/demo'
import { createInitialState } from '../fixtures/initial-state'
import { loadPersistedSession, schedulePersistDemoState } from './demo-state-persistence'

function hydrateState(): DemoState {
  const state = createInitialState()
  const persisted = loadPersistedSession()
  if (!persisted) return state

  state.walletPreparation = persisted.walletPreparation
  state.settings = { ...state.settings, ...persisted.settings }
  state.wallet = { ...state.wallet, ...persisted.wallet }
  return state
}

let state: DemoState = hydrateState()

export function getState(): DemoState {
  return state
}

export function resetState(): void {
  state = createInitialState()
  schedulePersistDemoState(state)
}

export function setState(next: DemoState): void {
  state = next
  schedulePersistDemoState(state)
}

export function persistCurrentState(): void {
  schedulePersistDemoState(state)
}
