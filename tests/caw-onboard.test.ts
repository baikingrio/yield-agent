import { describe, expect, it } from 'vitest'
import type { AppState } from '../shared/types/app'
import {
  buildCawOnboardStatusFromState,
  getCawOnboardStatus,
  runCawOnboardStep,
} from '../server/utils/caw-onboard'

function createState(): AppState {
  return {
    wallet: { address: '', totalAssetsUsdc: 0, currentApy: 0, cumulativeYieldUsdc: 0 },
    walletPreparation: {
      network: 'base-sepolia',
      eoa: { connected: true, address: '0xEoa', label: 'Demo EOA' },
      agentWallet: {
        created: true,
        address: '0xAgent',
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
      defaultAgentFee: 10,
      userSplit: 90,
      agentId: 'agent-1',
    },
  }
}

describe('caw onboard utility', () => {
  it('builds onboard status from local state without CLI', () => {
    const result = buildCawOnboardStatusFromState(createState())
    expect(result).toMatchObject({
      healthy: true,
      walletStatus: 'active',
      walletPaired: true,
      phase: 'active',
      agentId: 'agent-1',
      walletUuid: 'wallet-1',
    })
  })

  it('returns sanitized active wallet status without API keys', async () => {
    const result = await getCawOnboardStatus({
      runner: async (args) => {
        if (args.join(' ') === 'status') {
          return { stdout: JSON.stringify({ healthy: true, wallet_status: 'active', wallet_paired: true }) }
        }
        if (args.join(' ') === 'wallet current') {
          return {
            stdout: JSON.stringify({
              agent_id: 'caw_agent_123',
              agent_name: 'YieldAgent',
              wallet_uuid: 'wallet-1',
              wallet_name: 'YieldAgent Wallet',
              api_url: 'https://api-core.agenticwallet.dev.cobo.com',
              api_key: 'must-not-leak',
            }),
          }
        }
        throw new Error(`unexpected ${args.join(' ')}`)
      },
    })

    expect(result).toMatchObject({
      healthy: true,
      walletStatus: 'active',
      walletPaired: true,
      phase: 'active',
      agentId: 'caw_agent_123',
      walletUuid: 'wallet-1',
    })
    expect(JSON.stringify(result)).not.toContain('must-not-leak')
  })

  it('preserves onboarding session id and prompt metadata for follow-up answers', async () => {
    const calls: string[] = []
    const result = await runCawOnboardStep({ agentName: 'YieldAgent' }, {
      runner: async (args) => {
        calls.push(args.join(' '))
        if (args[0] === 'onboard') {
          return {
            stdout: JSON.stringify({
              phase: 'collect_credentials',
              session_id: 'sess-1',
              needs_input: true,
              prompts: [{ id: 'api_key', label: 'API Key', secret: true, required: true }],
              next_action: 'submit answers',
            }),
          }
        }
        if (args.join(' ') === 'status') return { stdout: JSON.stringify({ healthy: true, wallet_status: 'pending', wallet_paired: false }) }
        if (args.join(' ') === 'wallet current') return { stdout: '{}' }
        throw new Error(`unexpected ${args.join(' ')}`)
      },
    })

    expect(calls[0]).toBe('onboard --agent-name YieldAgent')
    expect(result.sessionId).toBe('sess-1')
    expect(result.needsInput).toBe(true)
    expect(result.prompts[0]).toMatchObject({ id: 'api_key', secret: true })
  })
})
