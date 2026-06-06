import { afterEach, describe, expect, it, vi } from 'vitest'
import type { DemoState } from '../shared/types/demo'

const createWallet = vi.fn()
const getWallet = vi.fn()
const createWalletAddress = vi.fn()

vi.mock('../server/utils/cobo-client', () => ({
  createCoboWalletsApi: vi.fn(() => ({
    createWallet,
    getWallet,
    createWalletAddress,
  })),
  createCoboBalanceApi: vi.fn(),
  extractCoboErrorMessage: vi.fn((err: unknown) => err instanceof Error ? err.message : 'Cobo API 请求失败'),
}))

function createState(overrides: Partial<DemoState> = {}): DemoState {
  const base: DemoState = {
    wallet: { address: '', totalAssetsUsdc: 0, currentApy: 0, cumulativeYieldUsdc: 0 },
    walletPreparation: {
      network: 'base-sepolia',
      eoa: { connected: true, address: '0xEoa', label: 'Demo EOA' },
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
    settings: { network: 'base-sepolia', apiKeyConfigured: true, coboApiKey: 'caw-key', defaultAgentFee: 10, userSplit: 90 },
  }

  return {
    ...base,
    ...overrides,
    settings: { ...base.settings, ...overrides.settings },
    walletPreparation: { ...base.walletPreparation, ...overrides.walletPreparation },
  }
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
  createWallet.mockReset()
  getWallet.mockReset()
  createWalletAddress.mockReset()
})

describe('createCoboAgentWallet pairing reuse', () => {
  it('regenerates a pairing code for an existing unpaired Agent Wallet instead of creating another wallet', async () => {
    vi.stubEnv('CAW_ADOPT_EXISTING_WALLET', 'false')
    vi.stubEnv('AGENT_WALLET_ENV', 'dev')
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => ({
        success: true,
        result: { token: '12345678', expires_at: '2026-06-06T12:00:00Z' },
      }),
    })))
    createWallet.mockResolvedValue({ data: { result: { uuid: 'wallet-new' } } })
    getWallet.mockResolvedValue({ data: { result: { status: 'active' } } })
    createWalletAddress.mockResolvedValue({ data: { result: { address: '0xNewAgent' } } })

    const state = createState({
      walletPreparation: {
        network: 'base-sepolia',
        eoa: { connected: true, address: '0xEoa', label: 'Demo EOA' },
        agentWallet: {
          created: true,
          address: '0xExistingAgent',
          coboWalletId: 'wallet-existing',
          pairing: { status: 'unpaired', code: null, expiresAt: null },
        },
        funding: { status: 'idle', depositedUsdc: 0, availableUsdc: 0, lastTxHash: null },
        steps: { eoa: 'completed', agent_wallet: 'completed', funding: 'pending' },
        ready: false,
        updatedAt: new Date(0).toISOString(),
      },
    })

    const { createCoboAgentWallet } = await import('../server/utils/cobo-preparation')
    const prep = await createCoboAgentWallet(state)

    expect(createWallet).not.toHaveBeenCalled()
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://api-core.agenticwallet.dev.cobo.com/api/v1/wallets/pairs/initiate',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ wallet_id: 'wallet-existing' }),
      }),
    )
    expect(prep.agentWallet.coboWalletId).toBe('wallet-existing')
    expect(prep.agentWallet.address).toBe('0xExistingAgent')
    expect(prep.agentWallet.pairing).toEqual({
      status: 'pairing',
      code: '12345678',
      expiresAt: '2026-06-06T12:00:00Z',
    })
  })
})
