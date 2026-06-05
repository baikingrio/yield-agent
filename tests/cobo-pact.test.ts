import { describe, expect, it } from 'vitest'
import type { DemoState, Pact } from '../shared/types/demo'
import { applyCoboPactStatusToState, mapCoboPactStatus, syncCoboPactStatus } from '../server/utils/cobo-pact'

function createStateWithPact(status: Pact['status'] = 'awaiting-approval'): DemoState {
  return {
    wallet: {
      address: '0xDemo',
      totalAssetsUsdc: 100,
      currentApy: 5,
      cumulativeYieldUsdc: 1,
    },
    walletPreparation: {
      network: 'base-sepolia',
      eoa: { connected: true, address: '0xEoa', label: 'Demo EOA' },
      agentWallet: { created: true, address: '0xAgent', coboWalletId: 'wallet-1' },
      funding: { status: 'ready', depositedUsdc: 100, availableUsdc: 100, lastTxHash: null },
      steps: { eoa: 'completed', agent_wallet: 'completed', funding: 'completed' },
      ready: true,
      updatedAt: new Date(0).toISOString(),
    },
    strategies: [
      {
        id: 'strategy-1',
        name: 'Demo Strategy',
        network: 'base-sepolia',
        asset: 'USDC',
        riskLevel: 'balanced',
        maxSpend: 100,
        status: 'active',
        pactId: 'pact-1',
        createdAt: new Date(0).toISOString(),
      },
    ],
    pacts: [
      {
        id: 'pact-1',
        strategyId: 'strategy-1',
        intent: 'Demo intent',
        status,
        maxSpend: 100,
        whitelist: ['Aave 存入'],
        durationDays: 7,
        agentFeePercent: 10,
        userSplitPercent: 90,
        submissionMode: 'cobo',
        coboPactId: 'pact-1',
        coboStatus: 'PENDING_APPROVAL',
      },
    ],
    logs: [],
    yieldSeries7d: [],
    yieldSeries30d: [],
    settings: {
      network: 'base-sepolia',
      apiKeyConfigured: true,
      defaultAgentFee: 10,
      userSplit: 90,
      coboApiKey: 'demo-key',
    },
  }
}

describe('Cobo Pact status mapping', () => {
  it('maps Cobo lifecycle statuses into local Pact statuses', () => {
    expect(mapCoboPactStatus('PENDING_APPROVAL')).toBe('awaiting-approval')
    expect(mapCoboPactStatus('ACTIVE')).toBe('active')
    expect(mapCoboPactStatus('COMPLETED')).toBe('completed')
    expect(mapCoboPactStatus('REJECTED')).toBe('terminated')
    expect(mapCoboPactStatus('REVOKED')).toBe('terminated')
  })
})

describe('syncCoboPactStatus', () => {
  it('fetches the latest Cobo status and applies it to local state', async () => {
    const state = createStateWithPact('awaiting-approval')

    const pact = await syncCoboPactStatus(state, 'pact-1', async (id) => {
      expect(id).toBe('pact-1')
      return { status: 'ACTIVE', message: 'Approved from API' }
    })

    expect(pact.status).toBe('active')
    expect(pact.submissionMessage).toBe('Approved from API')
    expect(state.strategies[0]?.status).toBe('active')
  })

  it('keeps local-draft pacts local instead of calling Cobo', async () => {
    const state = createStateWithPact('awaiting-approval')
    state.pacts[0]!.submissionMode = 'local-draft'
    let called = false

    const pact = await syncCoboPactStatus(state, 'pact-1', async () => {
      called = true
      return { status: 'ACTIVE' }
    })

    expect(called).toBe(false)
    expect(pact.status).toBe('awaiting-approval')
  })
})

describe('applyCoboPactStatusToState', () => {
  it('activates the local pact and strategy when Cobo status becomes ACTIVE', () => {
    const state = createStateWithPact('awaiting-approval')

    const pact = applyCoboPactStatusToState(state, 'pact-1', 'ACTIVE', 'Approved in Cobo')

    expect(pact.status).toBe('active')
    expect(pact.coboStatus).toBe('ACTIVE')
    expect(pact.submissionMessage).toBe('Approved in Cobo')
    expect(state.strategies[0]?.status).toBe('active')
    expect(state.logs[0]?.action).toContain('Pact 状态已同步')
    expect(state.logs[0]?.type).toBe('pact')
    expect(state.logs[0]?.status).toBe('已激活')
  })

  it('pauses the strategy when Cobo reports a rejected or revoked pact', () => {
    const state = createStateWithPact('awaiting-approval')

    const pact = applyCoboPactStatusToState(state, 'pact-1', 'REJECTED', 'Rejected in Cobo')

    expect(pact.status).toBe('terminated')
    expect(state.strategies[0]?.status).toBe('paused')
    expect(state.logs[0]?.status).toBe('已终止')
  })

  it('does not append duplicate logs when the mapped status did not change', () => {
    const state = createStateWithPact('active')

    applyCoboPactStatusToState(state, 'pact-1', 'ACTIVE', 'Still active')

    expect(state.logs).toHaveLength(0)
    expect(state.pacts[0]?.submissionMessage).toBe('Still active')
  })
})
