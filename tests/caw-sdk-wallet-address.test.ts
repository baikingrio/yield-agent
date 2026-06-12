import { afterEach, describe, expect, it, vi } from 'vitest'
import type { AppState } from '../shared/types/app'

const createWalletAddress = vi.hoisted(() => vi.fn())
const listWalletAddresses = vi.hoisted(() => vi.fn())

vi.mock('../server/utils/cobo-client', () => ({
  createCoboWalletsApi: vi.fn(() => ({
    createWalletAddress,
    listWalletAddresses,
  })),
  withCoboRetry: (operation: () => Promise<unknown>) => operation(),
  extractCoboErrorMessage: (err: unknown) => (err instanceof Error ? err.message : String(err)),
}))

import { resolveEvmAddressFromSdk } from '../server/utils/caw-sdk-wallet'

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
})

describe('resolveEvmAddressFromSdk', () => {
  it('lists existing addresses before creating a new one', async () => {
    listWalletAddresses.mockResolvedValue({
      data: {
        result: [{
          address: '0x1111111111111111111111111111111111111111',
          chain_type: 'ETH',
          created_at: '2026-06-10T05:31:01Z',
        }],
      },
    })

    const address = await resolveEvmAddressFromSdk(createState(), 'wallet-1')

    expect(address).toBe('0x1111111111111111111111111111111111111111')
    expect(createWalletAddress).not.toHaveBeenCalled()
  })

  it('picks the oldest valid EVM address when multiple exist', async () => {
    listWalletAddresses.mockResolvedValue({
      data: {
        result: [
          {
            address: '0x2222222222222222222222222222222222222222',
            chain_type: 'ETH',
            compatible_chains: ['TBASE_SETH'],
            created_at: '2026-06-12T02:26:26Z',
          },
          {
            address: '0x1111111111111111111111111111111111111111',
            chain_type: 'ETH',
            compatible_chains: ['TBASE_SETH'],
            created_at: '2026-06-10T05:31:01Z',
          },
        ],
      },
    })

    const address = await resolveEvmAddressFromSdk(createState(), 'wallet-1')

    expect(address).toBe('0x1111111111111111111111111111111111111111')
    expect(createWalletAddress).not.toHaveBeenCalled()
  })

  it('creates an address only when none exist yet', async () => {
    listWalletAddresses
      .mockResolvedValueOnce({ data: { result: [] } })
      .mockResolvedValueOnce({ data: { result: [] } })
    createWalletAddress.mockResolvedValue({
      data: { result: { address: '0x3333333333333333333333333333333333333333' } },
    })

    const address = await resolveEvmAddressFromSdk(createState(), 'wallet-1')

    expect(address).toBe('0x3333333333333333333333333333333333333333')
    expect(createWalletAddress).toHaveBeenCalledOnce()
  })
})
