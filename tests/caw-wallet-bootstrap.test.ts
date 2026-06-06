import { afterEach, describe, expect, it, vi } from 'vitest'
import type { DemoState } from '../shared/types/demo'

const provisionCawPrincipal = vi.hoisted(() => vi.fn())

vi.mock('../server/utils/caw-provision', () => ({
  provisionCawPrincipal,
}))

import * as bootstrap from '../server/utils/caw-wallet-bootstrap'

function createState(): DemoState {
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
    settings: { network: 'base-sepolia', apiKeyConfigured: false, defaultAgentFee: 10, userSplit: 90 },
  }
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
  provisionCawPrincipal.mockReset()
})

describe('detectBootstrapMode', () => {
  it('prefers cli-onboard when caw node health is healthy', async () => {
    const runner = vi.fn(async (args: string[]) => {
      if (args.join(' ') === 'node health') {
        return { stdout: JSON.stringify({ healthy: true }) }
      }
      throw new Error('unexpected')
    })

    vi.spyOn(bootstrap, 'resolveCawCliBin').mockResolvedValue('/usr/local/bin/caw')
    const mode = await bootstrap.detectBootstrapMode(runner)
    expect(mode).toBe('cli-onboard')
  })

  it('falls back to sdk-create when CLI is unavailable but main node is configured', async () => {
    vi.stubEnv('AGENT_WALLET_MAIN_NODE_ID', 'node-123')
    vi.stubEnv('CAW_CLI_BIN', '/tmp/missing-caw-bin')

    const mode = await bootstrap.detectBootstrapMode()
    expect(mode).toBe('sdk-create')
  })

  it('returns unavailable when neither CLI nor main node is configured', async () => {
    vi.stubEnv('CAW_CLI_BIN', '/tmp/missing-caw-bin')

    const mode = await bootstrap.detectBootstrapMode()
    expect(mode).toBe('unavailable')
  })
})

describe('checkTssReadiness', () => {
  it('treats local TSS as online even when caw node status exits non-zero with partial JSON', async () => {
    const err = new Error('remote status forbidden') as Error & { stdout: string }
    err.stdout = JSON.stringify({
      local: { running: true },
      remote: { error: '403 Forbidden' },
    })
    const runner = vi.fn(async (args: string[]) => {
      if (args.join(' ') === 'node status') throw err
      throw new Error('unexpected')
    })

    const readiness = await bootstrap.checkTssReadiness(createState(), null, runner)

    expect(readiness.online).toBe(true)
    expect(readiness.source).toBe('cli-local')
  })
})

describe('syncCredentialsFromCli', () => {
  it('writes api key from caw wallet current into settings without provisioning', async () => {
    const runner = vi.fn(async (args: string[]) => {
      if (args.join(' ') === 'wallet current --show-api-key') {
        return {
          stdout: JSON.stringify({
            api_key: 'cli-api-key',
            agent_id: 'agent-from-cli',
            wallet_uuid: 'wallet-1',
          }),
        }
      }
      throw new Error('unexpected')
    })

    const state = createState()
    const ok = await bootstrap.syncCredentialsFromCli(state, runner)

    expect(ok).toBe(true)
    expect(state.settings.coboApiKey).toBe('cli-api-key')
    expect(state.settings.agentId).toBe('agent-from-cli')
    expect(state.settings.apiKeyConfigured).toBe(true)
  })

  it('skips CLI sync when settings already has an api key', async () => {
    const runner = vi.fn()
    const state = createState()
    state.settings.coboApiKey = 'existing-key'
    state.settings.apiKeyConfigured = true

    const ok = await bootstrap.syncCredentialsFromCli(state, runner)

    expect(ok).toBe(true)
    expect(runner).not.toHaveBeenCalled()
  })
})

describe('parsePairStatusPayload', () => {
  it('treats token_status completed as paired', () => {
    expect(bootstrap.parsePairStatusPayload({
      token_purpose: 'pair',
      token_status: 'completed',
    })).toBe('paired')
  })

  it('treats pending token_status as pairing', () => {
    expect(bootstrap.parsePairStatusPayload({
      token_purpose: 'pair',
      token_status: 'pending',
      token: '12345678',
    })).toBe('pairing')
  })
})

describe('ensureCawCredentials', () => {
  it('does not provision when settings already has an api key', async () => {
    const state = createState()
    state.settings.coboApiKey = 'settings-key'
    state.settings.apiKeyConfigured = true

    await bootstrap.ensureCawCredentials(state)

    expect(provisionCawPrincipal).not.toHaveBeenCalled()
  })

  it('does not provision when AGENT_WALLET_API_KEY env is set', async () => {
    vi.stubEnv('AGENT_WALLET_API_KEY', 'env-key')
    const state = createState()

    await bootstrap.ensureCawCredentials(state)

    expect(provisionCawPrincipal).not.toHaveBeenCalled()
  })
})
