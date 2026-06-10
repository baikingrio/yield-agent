import { describe, expect, it } from 'vitest'
import type { AppState } from '../shared/types/app'
import { validateStrategyPayload } from '../server/utils/strategy-validator'

function createState(): AppState {
  return {
    wallet: { address: '0x1', totalAssetsUsdc: 100, currentApy: 0, cumulativeYieldUsdc: 0 },
    walletPreparation: {
      network: 'base-sepolia',
      eoa: { connected: true, address: '0x2', label: 'EOA' },
      agentWallet: { created: true, address: '0x3', coboWalletId: 'w1' },
      funding: { status: 'ready', depositedUsdc: 100, availableUsdc: 100, lastTxHash: null },
      steps: { eoa: 'completed', agent_wallet: 'completed', funding: 'completed' },
      ready: true,
      updatedAt: new Date(0).toISOString(),
    },
    strategies: [],
    pacts: [],
    logs: [],
    yieldSeries7d: [],
    yieldSeries30d: [],
    settings: { network: 'base-sepolia', apiKeyConfigured: false, defaultAgentFee: 15, userSplit: 85 },
  }
}

describe('validateStrategyPayload', () => {
  it('rejects spend above available balance', () => {
    const result = validateStrategyPayload(createState(), {
      network: 'base-sepolia',
      asset: 'USDC',
      riskLevel: 'conservative',
      maxSpend: '200',
      agentFee: '15',
      userSplit: '85',
    })
    expect(result.valid).toBe(false)
    expect(result.errors.maxSpend).toContain('不能超过')
  })

  it('accepts valid payload on base-sepolia', () => {
    const result = validateStrategyPayload(createState(), {
      network: 'base-sepolia',
      asset: 'USDC',
      riskLevel: 'conservative',
      maxSpend: '50',
      agentFee: '15',
      userSplit: '85',
    })
    expect(result.valid).toBe(true)
  })
})
