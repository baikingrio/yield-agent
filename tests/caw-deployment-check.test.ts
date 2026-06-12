import { afterEach, describe, expect, it, vi } from 'vitest'
import type { AppState } from '../shared/types/app'
import { buildCawDeploymentCheck } from '../server/utils/caw-deployment-check'

function createState(overrides: Partial<AppState> = {}): AppState {
  const base: AppState = {
    wallet: { address: '', totalAssetsUsdc: 0, currentApy: 0, cumulativeYieldUsdc: 0 },
    walletPreparation: {
      network: 'base-sepolia',
      eoa: { connected: true, address: '0xEoa', label: 'EOA' },
      agentWallet: { created: false, address: '', coboWalletId: 'wallet-1' },
      funding: { status: 'idle', depositedUsdc: 0, availableUsdc: 0, lastTxHash: null },
      steps: { eoa: 'completed', agent_wallet: 'in_progress', funding: 'pending' },
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

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('buildCawDeploymentCheck', () => {
  it('flags missing api key on hermes-agent-host runtime', () => {
    vi.stubEnv('AGENT_WALLET_TSS_RUNTIME', 'hermes-agent-host')
    vi.stubEnv('AGENT_WALLET_API_KEY', '')
    const check = buildCawDeploymentCheck(createState())
    expect(check.apiKeyConfigured).toBe(false)
    expect(check.preferEnvKey).toBe(true)
    expect(check.blockers).toContain('missing_api_key')
    expect(check.nextActions.length).toBeGreaterThan(0)
  })

  it('flags node id mismatch when probe differs from MAIN_NODE_ID', () => {
    vi.stubEnv('AGENT_WALLET_MAIN_NODE_ID', 'node-configured')
    vi.stubEnv('AGENT_WALLET_API_KEY', 'env-key')
    const check = buildCawDeploymentCheck(createState(), {
      tssOnline: true,
      boundTssNodeId: 'node-bound',
      walletStatus: 'preparing',
    })
    expect(check.blockers).toContain('node_id_mismatch')
    expect(check.mainNodeMatchesBound).toBe(false)
  })

  it('warns when settings api key is used on split deploy', () => {
    vi.stubEnv('AGENT_WALLET_TSS_RUNTIME', 'hermes-agent-host')
    vi.stubEnv('VERCEL', '1')
    const state = createState()
    state.settings.coboApiKey = 'session-key'
    state.settings.apiKeyConfigured = true
    const check = buildCawDeploymentCheck(state)
    expect(check.apiKeySource).toBe('settings')
    expect(check.blockers).toContain('prefer_env_api_key')
  })

  it('flags ephemeral database on Vercel without DATABASE_PATH', () => {
    vi.stubEnv('VERCEL', '1')
    vi.stubEnv('DATABASE_PATH', '')
    vi.stubEnv('DATABASE_URL', '')
    const check = buildCawDeploymentCheck(createState())
    expect(check.blockers).toContain('ephemeral_database')
    expect(check.databaseBackend).toBe('ephemeral')
  })

  it('uses postgres backend when DATABASE_URL is configured on Vercel', () => {
    vi.stubEnv('VERCEL', '1')
    vi.stubEnv('DATABASE_URL', 'postgresql://example')
    const check = buildCawDeploymentCheck(createState())
    expect(check.blockers).not.toContain('ephemeral_database')
    expect(check.databaseBackend).toBe('postgres')
  })

  it('includes env template placeholders without secrets', () => {
    vi.stubEnv('AGENT_WALLET_MAIN_NODE_ID', 'node-abc')
    const check = buildCawDeploymentCheck(createState())
    expect(check.envTemplate).toContain('AGENT_WALLET_API_KEY=')
    expect(check.envTemplate).toContain('node-abc')
    expect(check.envTemplate).not.toContain('session-key')
  })
})
