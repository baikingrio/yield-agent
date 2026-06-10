import { describe, expect, it } from 'vitest'
import type { Pact, Strategy } from '../shared/types/app'
import {
  formatLivePactSummary,
  listLivePacts,
  pickActivePact,
  pickDenialDemoPact,
} from '../app/utils/active-pact'

const strategies: Strategy[] = [
  {
    id: 's1',
    name: 'Conservative',
    network: 'base-sepolia',
    asset: 'USDC',
    riskLevel: 'conservative',
    maxSpend: 500,
    status: 'active',
    pactId: 'p1',
    createdAt: new Date(0).toISOString(),
  },
  {
    id: 's2',
    name: 'Balanced',
    network: 'base-sepolia',
    asset: 'USDC',
    riskLevel: 'balanced',
    maxSpend: 300,
    status: 'active',
    pactId: 'p2',
    createdAt: new Date(0).toISOString(),
  },
]

describe('listLivePacts', () => {
  it('returns all active pacts before pending ones', () => {
    const pacts: Pact[] = [
      { id: 'p3', strategyId: 's3', intent: '', status: 'pending', maxSpend: 100, whitelist: [], durationDays: 7, agentFeePercent: 15, userSplitPercent: 85 },
      { id: 'p2', strategyId: 's2', intent: '', status: 'active', maxSpend: 300, whitelist: ['compound'], durationDays: 14, agentFeePercent: 15, userSplitPercent: 85 },
      { id: 'p1', strategyId: 's1', intent: 'test', status: 'active', maxSpend: 500, whitelist: ['aave'], durationDays: 7, agentFeePercent: 15, userSplitPercent: 85 },
    ]

    const result = listLivePacts(pacts, strategies)
    expect(result.map((item) => item.pact.id)).toEqual(['p2', 'p1', 'p3'])
    expect(result).toHaveLength(3)
  })

  it('excludes completed and terminated pacts', () => {
    const pacts: Pact[] = [
      { id: 'p1', strategyId: 's1', intent: '', status: 'active', maxSpend: 500, whitelist: [], durationDays: 7, agentFeePercent: 15, userSplitPercent: 85 },
      { id: 'p4', strategyId: 's4', intent: '', status: 'completed', maxSpend: 100, whitelist: [], durationDays: 7, agentFeePercent: 15, userSplitPercent: 85 },
      { id: 'p5', strategyId: 's5', intent: '', status: 'terminated', maxSpend: 100, whitelist: [], durationDays: 7, agentFeePercent: 15, userSplitPercent: 85 },
    ]

    expect(listLivePacts(pacts, strategies)).toHaveLength(1)
  })
})

describe('formatLivePactSummary', () => {
  it('summarizes counts across live statuses', () => {
    const pacts: Pact[] = [
      { id: 'p1', strategyId: 's1', intent: '', status: 'active', maxSpend: 500, whitelist: [], durationDays: 7, agentFeePercent: 15, userSplitPercent: 85 },
      { id: 'p2', strategyId: 's2', intent: '', status: 'active', maxSpend: 300, whitelist: [], durationDays: 7, agentFeePercent: 15, userSplitPercent: 85 },
      { id: 'p3', strategyId: 's3', intent: '', status: 'awaiting-approval', maxSpend: 100, whitelist: [], durationDays: 7, agentFeePercent: 15, userSplitPercent: 85 },
    ]

    expect(formatLivePactSummary(pacts)).toBe('2 个生效中 · 1 个待 Cobo 审批')
  })
})

describe('pickActivePact', () => {
  it('prefers first active pact in live list order', () => {
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
