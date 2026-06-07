import { describe, expect, it } from 'vitest'
import { createInitialState } from '../server/fixtures/initial-state'
import { stripDemoSeedData } from '../server/utils/strip-demo-seed'

describe('strip demo seed data', () => {
  it('returns unchanged empty state', () => {
    const state = createInitialState()
    const result = stripDemoSeedData(state)
    expect(result.changed).toBe(false)
    expect(result.state.strategies).toHaveLength(0)
  })

  it('removes legacy demo strategies, pacts, logs and yield series', () => {
    const state = createInitialState()
    state.strategies.push({
      id: 'str-demo-1',
      name: '演示策略',
      network: 'base-sepolia',
      asset: 'USDC',
      riskLevel: 'conservative',
      maxSpend: 5000,
      status: 'active',
      pactId: 'pact-demo-1',
      createdAt: '2026-05-28T10:00:00.000Z',
    })
    state.pacts.push({
      id: 'pact-demo-1',
      strategyId: 'str-demo-1',
      intent: '演示 Pact',
      status: 'active',
      maxSpend: 5000,
      whitelist: ['Aave 存入'],
      durationDays: 7,
      agentFeePercent: 15,
      userSplitPercent: 85,
    })
    state.logs.push({
      id: 'log-1',
      timestamp: '2026-06-03T08:12:00.000Z',
      action: '演示日志',
      type: 'supply',
      txHash: '0xabc',
      status: '成功',
    })
    state.yieldSeries7d = [{ date: '2026-06-01', cumulativeUsdc: 12 }]

    const result = stripDemoSeedData(state)
    expect(result.changed).toBe(true)
    expect(result.removedPactIds).toEqual(['pact-demo-1'])
    expect(result.state.strategies).toHaveLength(0)
    expect(result.state.pacts).toHaveLength(0)
    expect(result.state.logs).toHaveLength(0)
    expect(result.state.yieldSeries7d).toHaveLength(0)
  })
})
