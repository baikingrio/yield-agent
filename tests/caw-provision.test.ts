import { describe, expect, it, vi } from 'vitest'
import type { AppState } from '../shared/types/app'
import { provisionCawPrincipal } from '../server/utils/caw-provision'

function createState(): AppState {
  return {
    wallet: { address: '', totalAssetsUsdc: 0, currentApy: 0, cumulativeYieldUsdc: 0 },
    walletPreparation: {
      network: 'base-sepolia',
      eoa: { connected: false, address: null, label: '' },
      agentWallet: { created: false, address: '', coboWalletId: null },
      funding: { status: 'idle', depositedUsdc: 0, availableUsdc: 0, lastTxHash: null },
      steps: { eoa: 'pending', agent_wallet: 'pending', funding: 'pending' },
      ready: false,
      updatedAt: new Date(0).toISOString(),
    },
    strategies: [],
    pacts: [],
    logs: [],
    yieldSeries7d: [],
    yieldSeries30d: [],
    settings: { network: 'base-sepolia', apiKeyConfigured: false, defaultAgentFee: 10, userSplit: 90 },
  }
}

describe('provisionCawPrincipal', () => {
  it('posts to principals provision and stores the API key server-side only', async () => {
    const state = createState()
    const fetcher = vi.fn(async () => ({
      success: true,
      result: {
        agent_id: 'caw_agent_123',
        api_key: 'caw_secret_key',
        status: 'active',
      },
    }))

    const result = await provisionCawPrincipal(state, {
      name: 'YieldAgent Dev',
      baseUrl: 'https://api-core.agenticwallet.dev.cobo.com',
      fetcher,
    })

    expect(fetcher).toHaveBeenCalledWith(
      'https://api-core.agenticwallet.dev.cobo.com/api/v1/principals/provision',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'YieldAgent Dev' }),
      }),
    )
    expect(result).toEqual({ agentId: 'caw_agent_123', status: 'active' })
    expect(state.settings.agentId).toBe('caw_agent_123')
    expect(state.settings.apiKeyConfigured).toBe(true)
    expect(state.settings.coboApiKey).toBe('caw_secret_key')
  })

  it('throws a helpful error when provision response is unsuccessful', async () => {
    const state = createState()
    const fetcher = vi.fn(async () => ({ success: false, message: 'Provision failed' }))

    await expect(provisionCawPrincipal(state, {
      name: 'YieldAgent Dev',
      baseUrl: 'https://api-core.agenticwallet.dev.cobo.com',
      fetcher,
    })).rejects.toThrow('Provision failed')
  })
})
