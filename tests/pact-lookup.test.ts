import { describe, expect, it } from 'vitest'
import type { AppState, Pact } from '../shared/types/app'
import { findPactById } from '../server/utils/pact-lookup'

function stateWith(pact: Pact): AppState {
  return {
    wallet: { address: '', totalAssetsUsdc: 0, currentApy: 0, cumulativeYieldUsdc: 0 },
    walletPreparation: {} as AppState['walletPreparation'],
    strategies: [],
    pacts: [pact],
    logs: [],
    yieldSeries7d: [],
    yieldSeries30d: [],
    settings: {} as AppState['settings'],
  }
}

describe('findPactById', () => {
  it('finds by internal id', () => {
    const pact = { id: 'p1', coboPactId: 'cobo-1' } as Pact
    expect(findPactById(stateWith(pact), 'p1')?.id).toBe('p1')
  })

  it('finds by coboPactId', () => {
    const pact = { id: 'p1', coboPactId: 'cobo-1' } as Pact
    expect(findPactById(stateWith(pact), 'cobo-1')?.id).toBe('p1')
  })

  it('returns undefined when missing', () => {
    expect(findPactById(stateWith({ id: 'p1' } as Pact), 'missing')).toBeUndefined()
  })
})
