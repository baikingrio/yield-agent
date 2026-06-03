import type { DemoState } from '../../shared/types/demo'
import { createInitialState } from '../fixtures/initial-state'

let state: DemoState = createInitialState()

export function getState(): DemoState {
  return state
}

export function resetState(): void {
  state = createInitialState()
}

export function setState(next: DemoState): void {
  state = next
}
