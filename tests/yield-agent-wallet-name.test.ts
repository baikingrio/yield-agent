import { describe, expect, it } from 'vitest'
import type { AppState } from '../shared/types/app'
import { isYieldAgentWalletName, yieldAgentWalletName } from '../server/utils/yield-agent-wallet-name'

function createState(address: string | null): AppState {
  return {
    wallet: { address: '', totalAssetsUsdc: 0, currentApy: 0, cumulativeYieldUsdc: 0 },
    walletPreparation: {
      network: 'base-sepolia',
      eoa: { connected: Boolean(address), address, label: 'EOA' },
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

describe('yieldAgentWalletName', () => {
  it('uses stable name derived from EOA address', () => {
    const name = yieldAgentWalletName(createState('0x911984b11dF9B7Ad75e4CaDC9BEfAb7bC7830936'))
    expect(name).toBe('YieldAgent-911984b1')
  })

  it('detects YieldAgent wallet names', () => {
    expect(isYieldAgentWalletName('YieldAgent-911984b1')).toBe(true)
    expect(isYieldAgentWalletName('OtherWallet')).toBe(false)
  })
})
