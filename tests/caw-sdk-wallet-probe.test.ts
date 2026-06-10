import { afterEach, describe, expect, it, vi } from 'vitest'
import type { AppState } from '../shared/types/app'

const getWallet = vi.hoisted(() => vi.fn())
const getWalletNodeStatus = vi.hoisted(() => vi.fn())
const createWalletAddress = vi.hoisted(() => vi.fn())
const listWalletAddresses = vi.hoisted(() => vi.fn())

vi.mock('../server/utils/cobo-client', () => ({
  createCoboWalletsApi: vi.fn(() => ({
    getWallet,
    getWalletNodeStatus,
    createWalletAddress,
    listWalletAddresses,
  })),
  withCoboRetry: (operation: () => Promise<unknown>) => operation(),
  extractCoboErrorMessage: (err: unknown) => (err instanceof Error ? err.message : String(err)),
}))

import { probeWalletStatusFromSdk } from '../server/utils/caw-sdk-wallet'

function createState(): AppState {
  return {
    wallet: { address: '', totalAssetsUsdc: 0, currentApy: 0, cumulativeYieldUsdc: 0 },
    walletPreparation: {
      network: 'base-sepolia',
      eoa: { connected: true, address: '0xEoa', label: 'Demo EOA' },
      agentWallet: { created: false, address: '', coboWalletId: 'wallet-1' },
      funding: { status: 'idle', depositedUsdc: 0, availableUsdc: 0, lastTxHash: null },
      steps: { eoa: 'completed', agent_wallet: 'in_progress', funding: 'pending' },
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

describe('probeWalletStatusFromSdk', () => {
  it('infers preparing when getWallet fails but TSS node is online', async () => {
    vi.stubEnv('AGENT_WALLET_MAIN_NODE_ID', 'node-1')
    getWallet.mockRejectedValue(new Error('403 Forbidden'))
    getWalletNodeStatus.mockResolvedValue({ data: { result: { online: true } } })
    createWalletAddress.mockRejectedValue(new Error('not ready'))
    listWalletAddresses.mockResolvedValue({ data: { result: [] } })

    const probe = await probeWalletStatusFromSdk(createState(), 'wallet-1')

    expect(probe.status).toBe('preparing')
    expect(probe.inferredFrom).toBe('tss')
  })

  it('treats wallet as active when address can be resolved', async () => {
    getWallet.mockRejectedValue(new Error('403 Forbidden'))
    getWalletNodeStatus.mockRejectedValue(new Error('403 Forbidden'))
    createWalletAddress.mockResolvedValue({
      data: { result: { address: '0xAgentAddress' } },
    })

    const probe = await probeWalletStatusFromSdk(createState(), 'wallet-1')

    expect(probe.status).toBe('active')
    expect(probe.inferredFrom).toBe('address')
  })
})
