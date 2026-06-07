import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createInitialState } from '../server/fixtures/initial-state'
import { closeDatabase, resetDatabaseConnection } from '../server/db/client'
import { clearDatabase, loadStateFromDatabase, saveStateToDatabase } from '../server/db/repository'

describe('sqlite repository', () => {
  beforeEach(() => {
    process.env.DATABASE_PATH = ':memory:'
    resetDatabaseConnection()
    clearDatabase()
  })

  afterEach(() => {
    closeDatabase()
    resetDatabaseConnection()
    delete process.env.DATABASE_PATH
  })

  it('persists strategies, pacts, and logs across reload', () => {
    const state = createInitialState()
    state.strategies.push({
      id: 'str-test-1',
      name: '测试策略',
      network: 'base-sepolia',
      asset: 'USDC',
      riskLevel: 'conservative',
      maxSpend: 100,
      status: 'active',
      pactId: 'pact-test-1',
      createdAt: new Date(0).toISOString(),
    })
    state.pacts.push({
      id: 'pact-test-1',
      strategyId: 'str-test-1',
      intent: '测试',
      status: 'awaiting-approval',
      maxSpend: 100,
      whitelist: ['Aave 存入'],
      durationDays: 7,
      agentFeePercent: 15,
      userSplitPercent: 85,
      submissionMode: 'cobo',
    })
    state.logs.unshift({
      id: 'log-test-1',
      timestamp: new Date(0).toISOString(),
      action: 'Pact 已提交',
      type: 'pact',
      txHash: '',
      status: '待审批',
    })

    saveStateToDatabase(state)
    const loaded = loadStateFromDatabase()
    expect(loaded?.strategies.some((s) => s.id === 'str-test-1')).toBe(true)
    expect(loaded?.pacts.some((p) => p.id === 'pact-test-1')).toBe(true)
    expect(loaded?.logs.some((l) => l.id === 'log-test-1')).toBe(true)
  })
})
