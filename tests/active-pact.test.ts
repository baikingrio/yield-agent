import { describe, expect, it } from 'vitest'
import type { Pact, Strategy } from '../shared/types/app'
import { pickActivePact, pickDenialDemoPact } from '../app/utils/active-pact'

const strategies: Strategy[] = [{
  id: 's1',
  name: 'Conservative',
  network: 'base-sepolia',
  asset: 'USDC',
  riskLevel: 'conservative',
  maxSpend: 500,
  status: 'active',
  pactId: 'p1',
  createdAt: new Date(0).toISOString(),
}]

describe('pickActivePact', () => {
  it('prefers active pact over pending', () => {
    const pacts: Pact[] = [
      { id: 'p2', strategyId: 's2', intent: '', status: 'pending', maxSpend: 100, whitelist: [], durationDays: 7, agentFeePercent: 15, userSplitPercent: 85 },
      { id: 'p1', strategyId: 's1', intent: 'test', status: 'active', maxSpend: 500, whitelist: ['aave'], durationDays: 7, agentFeePercent: 15, userSplitPercent: 85 },
    ]
    const result = pickActivePact(pacts, strategies)
    expect(result?.pact.id).toBe('p1')
    expect(result?.strategy?.id).toBe('s1')
  })
})

describe('pickDenialDemoPact', () => {
  it('returns active pact for denial demo', () => {
    const pacts: Pact[] = [
      { id: 'p1', strategyId: 's1', intent: '', status: 'active', maxSpend: 500, whitelist: [], durationDays: 7, agentFeePercent: 15, userSplitPercent: 85 },
    ]
    expect(pickDenialDemoPact(pacts)?.id).toBe('p1')
  })
})
