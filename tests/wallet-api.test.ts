import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AppState } from '../shared/types/app'

const getState = vi.fn<() => AppState>()
const syncWalletSummaryFromCobo = vi.fn<(_state: AppState) => Promise<void>>()

vi.stubGlobal('defineEventHandler', <T>(fn: T) => fn)
vi.stubGlobal('getQuery', (event: { query?: Record<string, string> }) => event.query ?? {})

vi.mock('../server/utils/app-store', () => ({ getState }))
vi.mock('../server/utils/cobo-preparation', () => ({ syncWalletSummaryFromCobo }))

function createState(): AppState {
  return {
    wallet: {
      address: '0xAgent',
      totalAssetsUsdc: 500,
      currentApy: 0,
      cumulativeYieldUsdc: 0,
    },
    walletPreparation: {
      network: 'base-sepolia',
      eoa: { connected: true, address: '0xEoa', label: 'Demo EOA' },
      agentWallet: {
        created: true,
        address: '0xAgent',
        coboWalletId: 'wallet-1',
        pairing: { status: 'paired', code: null, expiresAt: null },
      },
      funding: { status: 'ready', depositedUsdc: 500, availableUsdc: 500, lastTxHash: null },
      steps: { eoa: 'completed', agent_wallet: 'completed', funding: 'completed' },
      ready: true,
      updatedAt: new Date(0).toISOString(),
    },
    strategies: [],
    pacts: [],
    logs: [],
    yieldSeries7d: [],
    yieldSeries30d: [],
    settings: { network: 'base-sepolia', apiKeyConfigured: true, defaultAgentFee: 10, userSplit: 90 },
  }
}

describe('GET /api/wallet handler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    syncWalletSummaryFromCobo.mockResolvedValue(undefined)
  })

  it('returns cached wallet without Cobo sync by default', async () => {
    const state = createState()
    getState.mockReturnValue(state)

    const handler = (await import('../server/api/wallet.get')).default
    const result = await handler({} as never)

    expect(result).toEqual(state.wallet)
    expect(syncWalletSummaryFromCobo).not.toHaveBeenCalled()
  })

  it('syncs from Cobo when sync=true', async () => {
    const state = createState()
    getState.mockReturnValue(state)

    const handler = (await import('../server/api/wallet.get')).default
    await handler({ query: { sync: 'true' } } as never)

    expect(syncWalletSummaryFromCobo).toHaveBeenCalledWith(state)
  })
})
