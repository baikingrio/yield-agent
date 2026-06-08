import { describe, expect, it } from 'vitest'
import type { AppState } from '../shared/types/app'
import { markAgentWalletCreated } from '../server/utils/wallet-preparation'

function createState(): AppState {
  return {
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
    settings: { network: 'base-sepolia', apiKeyConfigured: true, defaultAgentFee: 10, userSplit: 90 },
  }
}

describe('markAgentWalletCreated', () => {
  it('keeps step in progress until CAW App pairing completes', () => {
    const state = createState()
    const prep = markAgentWalletCreated(state, {
      address: '0xAgent',
      coboWalletId: 'wallet-1',
      pairing: { status: 'pairing', code: '12345678', expiresAt: null },
    })

    expect(prep.agentWallet.created).toBe(true)
    expect(prep.steps.agent_wallet).toBe('in_progress')
  })

  it('marks step completed when pairing is paired', () => {
    const state = createState()
    const prep = markAgentWalletCreated(state, {
      address: '0xAgent',
      coboWalletId: 'wallet-1',
      pairing: { status: 'paired', code: null, expiresAt: null },
    })

    expect(prep.steps.agent_wallet).toBe('completed')
  })
})
