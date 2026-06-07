import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createInitialState } from '../server/fixtures/initial-state'
import { closeDatabase, resetDatabaseConnection } from '../server/db/client'
import { clearDatabase, loadStateFromDatabase, saveStateToDatabase } from '../server/db/repository'
import { applyCoboPactStatusToState } from '../server/utils/cobo-pact'

describe('pacts batch sync persistence', () => {
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

  it('persists pact status after applyCoboPactStatusToState (batch sync path)', () => {
    const state = createInitialState()
    const pact: import('../shared/types/demo').Pact = {
      id: 'pact-sync-test',
      strategyId: 'str-sync-test',
      intent: '同步测试',
      status: 'awaiting-approval',
      maxSpend: 500,
      whitelist: ['Aave 存入'],
      durationDays: 7,
      agentFeePercent: 15,
      userSplitPercent: 85,
      submissionMode: 'cobo',
    }
    state.pacts.push(pact)

    applyCoboPactStatusToState(state, pact.id, 'active', 'Pact approved')
    saveStateToDatabase(state)

    const loaded = loadStateFromDatabase()
    const reloaded = loaded?.pacts.find((p) => p.id === pact.id)
    expect(reloaded?.status).toBe('active')
    expect(loaded?.logs.some((l) => l.pactId === pact.id)).toBe(true)
  })
})
