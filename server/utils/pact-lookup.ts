import type { AppState, Pact } from '../../shared/types/app'

export function findPactById(state: AppState, id: string): Pact | undefined {
  return state.pacts.find((p) => p.id === id || p.coboPactId === id)
}
