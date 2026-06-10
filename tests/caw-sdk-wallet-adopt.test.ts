import { afterEach, describe, expect, it, vi } from 'vitest'
import type { AppState } from '../shared/types/app'

const listWallets = vi.hoisted(() => vi.fn())
const createWallet = vi.hoisted(() => vi.fn())

vi.mock('../server/utils/cobo-client', () => ({
  createCoboWalletsApi: vi.fn(() => ({ listWallets, createWallet })),
  withCoboRetry: (operation: () => Promise<unknown>) => operation(),
  extractCoboErrorMessage: (err: unknown) => (err instanceof Error ? err.message : String(err)),
}))

vi.mock('../server/utils/caw-credentials', () => ({
  ensureCawCredentials: vi.fn(),
}))

import { bootstrapViaSdkCreate, findReusableYieldAgentWallet } from '../server/utils/caw-sdk-wallet'

function createState(): AppState {
  return {
    wallet: { address: '', totalAssetsUsdc: 0, currentApy: 0, cumulativeYieldUsdc: 0 },
    walletPreparation: {
      network: 'base-sepolia',
      eoa: { connected: true, address: '0x911984b11dF9B7Ad75e4CaDC9BEfAb7bC7830936', label: 'EOA' },
      agentWallet: { created: false, address: '', coboWalletId: null },
      funding: { status: 'idle', depositedUsdc: 0, availableUsdc: 0, lastTxHash: null },
      steps: { eoa: 'completed', agent_wallet: 'pending', funding: 'pending' },
      ready: false,
      updatedAt: new Date(0).toISOString(),
    },
    strategies: [],
    pacts: [],
    logs: [],
    yieldSeries7d: [],
    yieldSeries30d: [],
    settings: {
      network: 'base-sepolia',
      apiKeyConfigured: true,
      coboApiKey: 'test-key',
      defaultAgentFee: 10,
      userSplit: 90,
    },
  }
}

afterEach(() => {
  vi.clearAllMocks()
  vi.unstubAllEnvs()
})

describe('findReusableYieldAgentWallet', () => {
  it('prefers preparing YieldAgent wallet over creating a new one', async () => {
    vi.stubEnv('AGENT_WALLET_MAIN_NODE_ID', 'node-1')
    listWallets.mockResolvedValue({
      data: {
        result: [
          {
            uuid: 'wallet-old',
            name: 'YieldAgent-1700000000000',
            status: 'preparing',
            created_at: '2026-06-10T06:00:00.000Z',
          },
          {
            uuid: 'wallet-stable',
            name: 'YieldAgent-911984b1',
            status: 'preparing',
            created_at: '2026-06-10T07:00:00.000Z',
          },
        ],
      },
    })

    const reusable = await findReusableYieldAgentWallet(createState())

    expect(reusable?.uuid).toBe('wallet-stable')
  })
})

describe('bootstrapViaSdkCreate', () => {
  it('adopts existing wallet instead of calling createWallet', async () => {
    vi.stubEnv('AGENT_WALLET_MAIN_NODE_ID', 'node-1')
    listWallets.mockResolvedValue({
      data: {
        result: [{
          uuid: 'wallet-existing',
          name: 'YieldAgent-911984b1',
          status: 'preparing',
          created_at: '2026-06-10T07:00:00.000Z',
        }],
      },
    })

    const state = createState()
    const result = await bootstrapViaSdkCreate(state)

    expect(result.adopted).toBe(true)
    expect(result.walletUuid).toBe('wallet-existing')
    expect(createWallet).not.toHaveBeenCalled()
    expect(state.walletPreparation.agentWallet.coboWalletId).toBe('wallet-existing')
    expect(state.walletPreparation.steps.agent_wallet).toBe('in_progress')
  })

  it('creates stable wallet name when none exists', async () => {
    vi.stubEnv('AGENT_WALLET_MAIN_NODE_ID', 'node-1')
    listWallets.mockResolvedValue({ data: { result: [] } })
    createWallet.mockResolvedValue({ data: { result: { uuid: 'wallet-new' } } })

    const state = createState()
    const result = await bootstrapViaSdkCreate(state)

    expect(result.adopted).toBe(false)
    expect(createWallet).toHaveBeenCalledWith({
      wallet_type: 'MPC',
      name: 'YieldAgent-911984b1',
      group_type: 'agent',
      main_node_id: 'node-1',
    })
    expect(result.walletUuid).toBe('wallet-new')
  })
})
