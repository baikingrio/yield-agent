import { afterEach, describe, expect, it, vi } from 'vitest'
import type { AppState } from '../shared/types/app'
import { parseStrategyNaturalLanguage } from '../server/utils/hermes-strategy-parser'
import * as hermesClient from '../server/utils/hermes-strategy-client'

function createState(availableUsdc = 9.999999): AppState {
  return {
    wallet: { address: '0x1', totalAssetsUsdc: availableUsdc, currentApy: 0, cumulativeYieldUsdc: 0 },
    walletPreparation: {
      network: 'base-sepolia',
      eoa: { connected: true, address: '0x2', label: 'MetaMask' },
      agentWallet: { created: true, address: '0x3', coboWalletId: 'w1' },
      funding: { status: 'ready', depositedUsdc: availableUsdc, availableUsdc, lastTxHash: null },
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

const USER_TEXT =
  '在 Base Sepolia 测试网，每日投入最多 1 USDC 买入ETH，可以采用策略分批买入，累计买入一周。'

describe('parseStrategyNaturalLanguage', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('falls back locally when Hermes is unavailable and computes weekly maxSpend', async () => {
    const prevUrl = process.env.HERMES_API_URL
    const prevKey = process.env.HERMES_API_KEY
    delete process.env.HERMES_API_URL
    delete process.env.HERMES_API_KEY

    const result = await parseStrategyNaturalLanguage(createState(), USER_TEXT, {
      availableUsdc: 9.999999,
      network: 'base-sepolia',
    })

    expect(result.proposal.maxSpend).toBe('7')
    expect(result.proposal.riskLevel).toBe('aggressive')
    expect(result.fallbackAvailable).toBe(true)

    process.env.HERMES_API_URL = prevUrl
    process.env.HERMES_API_KEY = prevKey
  })

  it('returns 400-class validation errors when Hermes proposes spend above limits', async () => {
    vi.spyOn(hermesClient, 'callHermesStrategyAgent').mockResolvedValue({
      content: JSON.stringify({
        network: 'base-sepolia',
        asset: 'USDC',
        riskLevel: 'aggressive',
        maxSpend: '50',
        agentFee: '15',
        userSplit: '85',
        explanation: 'test',
        warnings: [],
      }),
    })

    await expect(
      parseStrategyNaturalLanguage(createState(9.999999), USER_TEXT, {
        availableUsdc: 9.999999,
        network: 'base-sepolia',
      }),
    ).rejects.toThrow('不能超过 Agent Wallet 可用余额')
  })

  it('accepts Hermes percent-formatted fee split fields', async () => {
    vi.spyOn(hermesClient, 'callHermesStrategyAgent').mockResolvedValue({
      content: JSON.stringify({
        network: 'base-sepolia',
        asset: 'USDC',
        riskLevel: 'balanced',
        maxSpend: '7',
        agentFee: '0%',
        userSplit: '100%',
        explanation: 'test',
        warnings: [],
      }),
    })

    const result = await parseStrategyNaturalLanguage(createState(9.999999), USER_TEXT, {
      availableUsdc: 9.999999,
      network: 'base-sepolia',
    })

    expect(result.proposal.agentFee).toBe('0')
    expect(result.proposal.userSplit).toBe('100')
  })

  it('does not mark validation failures as Hermes fallback (503)', async () => {
    vi.spyOn(hermesClient, 'callHermesStrategyAgent').mockResolvedValue({
      content: JSON.stringify({
        network: 'base-sepolia',
        asset: 'USDC',
        riskLevel: 'conservative',
        maxSpend: '50',
        agentFee: '15',
        userSplit: '85',
        explanation: 'test',
        warnings: [],
      }),
    })

    const err = await parseStrategyNaturalLanguage(createState(9.999999), USER_TEXT, {
      availableUsdc: 9.999999,
      network: 'base-sepolia',
    }).catch((e: Error & { fallbackAvailable?: boolean }) => e)

    expect(err).toBeInstanceOf(Error)
    expect((err as Error & { fallbackAvailable?: boolean }).fallbackAvailable).toBeUndefined()
    expect((err as Error).message).toContain('不能超过 Agent Wallet 可用余额')
  })
})
