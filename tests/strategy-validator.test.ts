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
  it('rejects network mismatch with funded wallet', () => {
    const result = validateStrategyPayload(createState(), {
      network: 'arbitrum-sepolia',
      asset: 'USDC',
      riskLevel: 'conservative',
      maxSpend: '50',
      agentFee: '15',
      userSplit: '85',
    })

    expect(result.valid).toBe(false)
    expect(result.errors.network).toContain('注资网络')
  })

  it('accepts valid payload within balance', () => {
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

  it('accepts small testnet maxSpend from parse limits', () => {
    const result = validateStrategyPayload(
      createState(),
      {
        network: 'base-sepolia',
        asset: 'USDC',
        riskLevel: 'aggressive',
        maxSpend: '7',
        agentFee: '15',
        userSplit: '85',
      },
      { availableUsdc: 9.999999 },
    )

    expect(result.valid).toBe(true)
  })

  it('accepts zero agentFee and percent-formatted userSplit', () => {
    const result = validateStrategyPayload(createState(), {
      network: 'base-sepolia',
      asset: 'USDC',
      riskLevel: 'balanced',
      maxSpend: '7',
      agentFee: '0',
      userSplit: '100%',
    })

    expect(result.valid).toBe(true)
  })

  it('rejects maxSpend above parse limits availableUsdc', () => {
    const result = validateStrategyPayload(
      createState(),
      {
        network: 'base-sepolia',
        asset: 'USDC',
        riskLevel: 'conservative',
        maxSpend: '50',
        agentFee: '15',
        userSplit: '85',
      },
      { availableUsdc: 9.999999 },
    )

    expect(result.valid).toBe(false)
    expect(result.errors.maxSpend).toContain('9.999999')
  })
})
