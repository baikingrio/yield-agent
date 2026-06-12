import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createInitialState } from '../server/fixtures/initial-state'
import { closePostgres, resetPostgresConnection } from '../server/db/postgres-client'
import { resetDatabaseConnection } from '../server/db/client'
import {
  clearDatabaseAsync,
  loadStateFromDatabaseAsync,
  saveStateToDatabaseAsync,
} from '../server/db/repository'

const hasDatabaseUrl = Boolean(process.env.DATABASE_URL?.trim())

describe.skipIf(!hasDatabaseUrl)('postgres repository', () => {
  beforeEach(async () => {
    resetPostgresConnection()
    resetDatabaseConnection()
    await clearDatabaseAsync()
  })

  afterEach(async () => {
    await clearDatabaseAsync()
    await closePostgres()
    resetPostgresConnection()
    resetDatabaseConnection()
  })

  it('persists strategies, pacts, and logs across reload', async () => {
    const state = createInitialState()
    state.strategies.push({
      id: 'str-pg-1',
      name: 'Postgres 测试策略',
      network: 'base-sepolia',
      asset: 'USDC',
      riskLevel: 'conservative',
      maxSpend: 100,
      status: 'active',
      pactId: 'pact-pg-1',
      createdAt: new Date(0).toISOString(),
    })
    state.pacts.push({
      id: 'pact-pg-1',
      strategyId: 'str-pg-1',
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
      id: 'log-pg-1',
      timestamp: new Date(0).toISOString(),
      action: 'Pact 已提交',
      type: 'pact',
      txHash: '',
      status: '待审批',
    })

    await saveStateToDatabaseAsync(state)
    const loaded = await loadStateFromDatabaseAsync()
    expect(loaded?.strategies.some((s) => s.id === 'str-pg-1')).toBe(true)
    expect(loaded?.pacts.some((p) => p.id === 'pact-pg-1')).toBe(true)
    expect(loaded?.logs.some((l) => l.id === 'log-pg-1')).toBe(true)
  })

  it('persists null yield snapshot without violating kv_blob NOT NULL', async () => {
    const state = createInitialState()
    state.yieldSnapshotLastSuppliedUsdc = null
    await saveStateToDatabaseAsync(state)
    const loaded = await loadStateFromDatabaseAsync()
    expect(loaded?.yieldSnapshotLastSuppliedUsdc).toBeNull()
  })
})
