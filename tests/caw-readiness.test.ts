import { afterEach, describe, expect, it, vi } from 'vitest'
import type { DemoState } from '../shared/types/demo'
import { buildCawReadiness } from '../server/utils/caw-readiness'
import { getCoboBasePath, getCoboEnvironment } from '../server/utils/cobo-config'

const ORIGINAL_ENV = { ...process.env }

afterEach(() => {
  process.env = { ...ORIGINAL_ENV }
  vi.unstubAllEnvs()
})

function createState(overrides: Partial<DemoState> = {}): DemoState {
  const base: DemoState = {
    wallet: {
      address: '',
      totalAssetsUsdc: 0,
      currentApy: 0,
      cumulativeYieldUsdc: 0,
    },
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
    settings: {
      network: 'base-sepolia',
      apiKeyConfigured: false,
      defaultAgentFee: 10,
      userSplit: 90,
    },
  }

  return {
    ...base,
    ...overrides,
    settings: { ...base.settings, ...overrides.settings },
    walletPreparation: { ...base.walletPreparation, ...overrides.walletPreparation },
  }
}

describe('CAW environment config', () => {
  it('defaults to the CAW dev core API', () => {
    vi.stubEnv('AGENT_WALLET_ENV', '')
    vi.stubEnv('AGENT_WALLET_API_URL', '')

    expect(getCoboEnvironment()).toBe('dev')
    expect(getCoboBasePath()).toBe('https://api-core.agenticwallet.dev.cobo.com')
  })

  it('uses the CAW prod core API when env is prod', () => {
    vi.stubEnv('AGENT_WALLET_ENV', 'prod')
    vi.stubEnv('AGENT_WALLET_API_URL', '')

    expect(getCoboEnvironment()).toBe('prod')
    expect(getCoboBasePath()).toBe('https://api-core.agenticwallet.cobo.com')
  })

  it('treats explicit API URL as custom when env is not dev or prod', () => {
    vi.stubEnv('AGENT_WALLET_ENV', 'sandbox')
    vi.stubEnv('AGENT_WALLET_API_URL', 'https://example.test')

    expect(getCoboEnvironment()).toBe('custom')
    expect(getCoboBasePath()).toBe('https://example.test')
  })
})

describe('buildCawReadiness', () => {
  it('reports local-draft mode when API key is missing', () => {
    vi.stubEnv('AGENT_WALLET_API_KEY', '')
    vi.stubEnv('AGENT_WALLET_MAIN_NODE_ID', '')
    const state = createState()

    const readiness = buildCawReadiness(state)

    expect(readiness.pactMode).toBe('local-draft')
    expect(readiness.apiKeyConfigured).toBe(false)
    expect(readiness.apiKeySource).toBe('missing')
    expect(readiness.missing).toContain('Cobo API Key')
    expect(readiness.nextAction).toContain('Provision')
  })

  it('prefers settings API key over env API key for source labeling', () => {
    vi.stubEnv('AGENT_WALLET_API_KEY', 'env-key')
    const state = createState({ settings: { coboApiKey: 'settings-key' } })

    const readiness = buildCawReadiness(state)

    expect(readiness.apiKeyConfigured).toBe(true)
    expect(readiness.apiKeySource).toBe('settings')
  })

  it('reports Cobo Pact mode when API key, agent wallet, and funding are ready', () => {
    vi.stubEnv('AGENT_WALLET_API_KEY', 'env-key')
    vi.stubEnv('AGENT_WALLET_MAIN_NODE_ID', 'node-1')
    const state = createState({
      walletPreparation: {
        agentWallet: { created: true, address: '0xAgent', coboWalletId: 'wallet-1' },
        funding: { status: 'ready', depositedUsdc: 100, availableUsdc: 100, lastTxHash: '0xTx' },
        steps: { eoa: 'completed', agent_wallet: 'completed', funding: 'completed' },
        ready: true,
      } as DemoState['walletPreparation'],
    })

    const readiness = buildCawReadiness(state)

    expect(readiness.pactMode).toBe('cobo-pact')
    expect(readiness.mainNodeConfigured).toBe(true)
    expect(readiness.agentWalletConfigured).toBe(true)
    expect(readiness.fundingReady).toBe(true)
    expect(readiness.missing).toHaveLength(0)
  })
})
