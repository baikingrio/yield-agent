import { afterEach, describe, expect, it, vi } from 'vitest'
import type { AppState } from '../shared/types/app'
import { createInitialState } from '../server/fixtures/initial-state'

const listPacts = vi.hoisted(() => vi.fn())
const getPact = vi.hoisted(() => vi.fn())

const isCoboConfigured = vi.hoisted(() => vi.fn(() => true))

vi.mock('../server/utils/cobo-client', () => ({
  CoboNotConfiguredError: class CoboNotConfiguredError extends Error {},
  createCoboPactsApi: vi.fn(() => ({ listPacts, getPact })),
  isCoboConfigured,
  withCoboRetry: (operation: () => Promise<unknown>) => operation(),
}))

import {
  ensureCoboPactInState,
  normalizeCoboPactList,
  syncCoboPactsForAgentWallet,
} from '../server/utils/cobo-pact-import'
import { CoboNotConfiguredError } from '../server/utils/cobo-client'

function withAgentWallet(state: AppState): AppState {
  state.settings.coboApiKey = 'test-key'
  state.settings.apiKeyConfigured = true
  state.walletPreparation.agentWallet.coboWalletId = '3752834b-c0fa-4f8d-b6b5-00b992d09923'
  state.walletPreparation.agentWallet.created = true
  state.walletPreparation.agentWallet.address = '0xfbdc1f77d3ab2d42192fdd3962f4848efc0dc6bc'
  return state
}

afterEach(() => {
  vi.clearAllMocks()
})

describe('normalizeCoboPactList', () => {
  it('accepts array or wrapped pacts field', () => {
    expect(normalizeCoboPactList(undefined)).toEqual([])
    expect(normalizeCoboPactList([{ id: 'a' } as never])).toHaveLength(1)
    expect(normalizeCoboPactList({ pacts: [{ id: 'b' } as never] })).toHaveLength(1)
  })
})

describe('syncCoboPactsForAgentWallet', () => {
  it('throws when Cobo API key is not configured', async () => {
    isCoboConfigured.mockReturnValueOnce(false)
    await expect(syncCoboPactsForAgentWallet(withAgentWallet(createInitialState())))
      .rejects.toBeInstanceOf(CoboNotConfiguredError)
  })

  it('imports remote active pacts for the configured agent wallet', async () => {
    listPacts.mockResolvedValue({
      data: {
        result: {
          pacts: [
            {
              id: 'cobo-pact-1',
              name: 'YieldAgent 保守型收益',
              intent: '保守型 USDC 收益',
              status: 'active',
              wallet_id: '3752834b-c0fa-4f8d-b6b5-00b992d09923',
              created_at: '2026-06-08T00:00:00.000Z',
              expires_at: '2026-07-08T00:00:00.000Z',
              remaining: { usd_remaining: '180' },
            },
            {
              id: 'cobo-pact-2',
              name: 'YieldAgent 平衡型收益',
              intent: '平衡型 USDC 收益',
              status: 'active',
              wallet_id: '3752834b-c0fa-4f8d-b6b5-00b992d09923',
              created_at: '2026-06-09T00:00:00.000Z',
              expires_at: '2026-07-09T00:00:00.000Z',
              remaining: { usd_remaining: '120' },
            },
          ],
        },
      },
    })

    getPact.mockImplementation(async (pactId: string) => ({
      data: {
        result: {
          id: pactId,
          wallet_id: '3752834b-c0fa-4f8d-b6b5-00b992d09923',
          name: pactId === 'cobo-pact-1' ? 'YieldAgent 保守型收益' : 'YieldAgent 平衡型收益',
          intent: pactId === 'cobo-pact-1' ? '保守型 USDC 收益' : '平衡型 USDC 收益',
          status: 'active',
          spec: {
            policies: [{
              rules: { deny_if: { amount_gt: pactId === 'cobo-pact-1' ? '300' : '200' } },
            }],
          },
          progress_tx_count: 1,
          progress_usd_spent: pactId === 'cobo-pact-1' ? '120' : '80',
        },
      },
    }))

    const state = withAgentWallet(createInitialState())
    const result = await syncCoboPactsForAgentWallet(state)

    expect(result.remoteCount).toBe(2)
    expect(result.imported).toBe(2)
    expect(state.strategies).toHaveLength(2)
    expect(state.pacts.filter((pact) => pact.status === 'active')).toHaveLength(2)
    expect(listPacts).toHaveBeenCalledWith(
      undefined,
      '3752834b-c0fa-4f8d-b6b5-00b992d09923',
      undefined,
      undefined,
      0,
      50,
      false,
    )
  })

  it('imports a single remote pact by id when missing locally', async () => {
    getPact.mockResolvedValue({
      data: {
        result: {
          id: '35c06120-ef9f-47ee-b25b-3eab6571b696',
          wallet_id: '3752834b-c0fa-4f8d-b6b5-00b992d09923',
          name: 'YieldAgent 平衡型收益',
          intent: '平衡型 USDC 收益',
          status: 'active',
          spec: {
            policies: [{ rules: { deny_if: { amount_gt: '200' } } }],
          },
          progress_tx_count: 0,
          progress_usd_spent: '0',
        },
      },
    })

    const state = withAgentWallet(createInitialState())
    const pact = await ensureCoboPactInState(state, '35c06120-ef9f-47ee-b25b-3eab6571b696')

    expect(pact.id).toBe('35c06120-ef9f-47ee-b25b-3eab6571b696')
    expect(pact.status).toBe('active')
    expect(state.strategies).toHaveLength(1)
    expect(getPact).toHaveBeenCalledWith('35c06120-ef9f-47ee-b25b-3eab6571b696')
  })

  it('updates existing local pact status without duplicating imports', async () => {
    listPacts.mockResolvedValue({
      data: {
        result: {
          pacts: [{
            id: 'cobo-pact-1',
            name: 'YieldAgent 保守型收益',
            intent: '保守型 USDC 收益',
            status: 'active',
            wallet_id: '3752834b-c0fa-4f8d-b6b5-00b992d09923',
            created_at: '2026-06-08T00:00:00.000Z',
            expires_at: '2026-07-08T00:00:00.000Z',
          }],
        },
      },
    })

    const state = withAgentWallet(createInitialState())
    state.pacts.push({
      id: 'cobo-pact-1',
      strategyId: 'str-cobo-cobo-pact-1',
      intent: '保守型 USDC 收益',
      status: 'awaiting-approval',
      maxSpend: 300,
      whitelist: ['Aave 存入'],
      durationDays: 7,
      agentFeePercent: 15,
      userSplitPercent: 85,
      submissionMode: 'cobo',
      coboPactId: 'cobo-pact-1',
    })
    state.strategies.push({
      id: 'str-cobo-cobo-pact-1',
      name: 'YieldAgent 保守型收益',
      network: 'base-sepolia',
      asset: 'USDC',
      riskLevel: 'conservative',
      maxSpend: 300,
      status: 'active',
      pactId: 'cobo-pact-1',
      createdAt: new Date(0).toISOString(),
    })

    const result = await syncCoboPactsForAgentWallet(state)

    expect(result.imported).toBe(0)
    expect(result.updated).toBe(1)
    expect(state.pacts).toHaveLength(1)
    expect(state.pacts[0]?.status).toBe('active')
    expect(getPact).not.toHaveBeenCalled()
  })
})
