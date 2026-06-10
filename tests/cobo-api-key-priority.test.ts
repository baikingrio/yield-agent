import { afterEach, describe, expect, it, vi } from 'vitest'
import type { AppState } from '../shared/types/app'
import { getCoboApiKey } from '../server/utils/cobo-client'

function createState(coboApiKey?: string): AppState {
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
    settings: {
      network: 'base-sepolia',
      apiKeyConfigured: Boolean(coboApiKey),
      coboApiKey,
      defaultAgentFee: 10,
      userSplit: 90,
    },
  }
}

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('getCoboApiKey', () => {
  it('prefers AGENT_WALLET_API_KEY on Vercel over stale settings key', () => {
    vi.stubEnv('VERCEL', '1')
    vi.stubEnv('AGENT_WALLET_API_KEY', 'hermes-env-key')

    expect(getCoboApiKey(createState('stale-settings-key'))).toBe('hermes-env-key')
  })

  it('uses settings key locally when env is unset', () => {
    vi.stubEnv('AGENT_WALLET_API_KEY', '')

    expect(getCoboApiKey(createState('local-settings-key'))).toBe('local-settings-key')
  })
})
