import { describe, expect, it, vi } from 'vitest'
import type { AppState } from '../shared/types/app'

const submitPact = vi.hoisted(() => vi.fn())

vi.mock('../server/utils/cobo-api-key', () => ({
  refreshApiKeyFromCli: vi.fn().mockResolvedValue(false),
}))

vi.mock('../server/utils/cobo-client', () => ({
  createCoboPactsApi: () => ({ submitPact }),
  extractCoboErrorMessage: (err: unknown) => err instanceof Error ? err.message : 'Cobo Pact 提交失败',
  isCoboConfigured: (state: AppState) => Boolean(state.settings.coboApiKey),
  isInvalidApiKeyError: () => false,
}))

function createReadyState(): AppState {
  return {
    wallet: { address: '0xAgent', totalAssetsUsdc: 500, currentApy: 0, cumulativeYieldUsdc: 0 },
    walletPreparation: {
      network: 'base-sepolia',
      eoa: { connected: true, address: '0x1111111111111111111111111111111111111111', label: 'EOA' },
      agentWallet: {
        created: true,
        address: '0x2222222222222222222222222222222222222222',
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
    settings: {
      network: 'base-sepolia',
      apiKeyConfigured: true,
      coboApiKey: 'test-key',
      defaultAgentFee: 15,
      userSplit: 85,
    },
  }
}

describe('submitYieldPactToCobo fallback behavior', () => {
  it('keeps strategy creation usable as a local draft when Cobo Pact submission is not authorized', async () => {
    process.env.CAW_FORCE_LOCAL_DRAFT = 'true'
    submitPact.mockRejectedValueOnce(new Error('API key pact authorization is not authorized for this wallet'))
    const { submitYieldPactToCobo } = await import('../server/utils/cobo-pact')

    const result = await submitYieldPactToCobo(createReadyState(), {
      network: 'base-sepolia',
      asset: 'USDC',
      targetApy: '8',
      riskLevel: 'conservative',
      maxSpend: '500',
      agentFee: '15',
      userSplit: '85',
    }, 'pact-local-1')

    expect(result.mode).toBe('local-draft')
    expect(result.pactId).toBe('pact-local-1')
    expect(result.message).toContain('Cobo Pact 提交暂不可用')
    delete process.env.CAW_FORCE_LOCAL_DRAFT
  })

  it('allows local draft when developerMode is enabled in settings', async () => {
    delete process.env.CAW_FORCE_LOCAL_DRAFT
    const state = createReadyState()
    state.settings.coboApiKey = ''
    state.settings.apiKeyConfigured = false
    state.settings.developerMode = true
    const { submitYieldPactToCobo } = await import('../server/utils/cobo-pact')

    const result = await submitYieldPactToCobo(state, {
      network: 'base-sepolia',
      asset: 'USDC',
      targetApy: '8',
      riskLevel: 'conservative',
      maxSpend: '500',
      agentFee: '15',
      userSplit: '85',
    }, 'pact-dev-mode-1')

    expect(result.mode).toBe('local-draft')
    expect(result.pactId).toBe('pact-dev-mode-1')
  })

  it('throws when Cobo submission fails and local draft is not forced', async () => {
    delete process.env.CAW_FORCE_LOCAL_DRAFT
    submitPact.mockRejectedValueOnce(new Error('API key pact authorization is not authorized for this wallet'))
    const { submitYieldPactToCobo } = await import('../server/utils/cobo-pact')

    await expect(submitYieldPactToCobo(createReadyState(), {
      network: 'base-sepolia',
      asset: 'USDC',
      targetApy: '8',
      riskLevel: 'conservative',
      maxSpend: '500',
      agentFee: '15',
      userSplit: '85',
    }, 'pact-local-2')).rejects.toThrow('API key pact authorization is not authorized')
  })
})
