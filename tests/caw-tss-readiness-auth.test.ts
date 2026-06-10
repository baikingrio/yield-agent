import { afterEach, describe, expect, it, vi } from 'vitest'
import type { AppState } from '../shared/types/app'

const getWalletNodeStatus = vi.hoisted(() => vi.fn())

vi.mock('../server/utils/caw-cli', () => ({
  resolveCawCliBin: vi.fn(async () => null),
  defaultCawRunner: vi.fn(),
}))

vi.mock('../server/utils/cobo-client', () => ({
  isCoboConfigured: vi.fn(() => true),
  createCoboWalletsApi: vi.fn(() => ({ getWalletNodeStatus })),
  withCoboRetry: vi.fn((fn: () => unknown) => fn()),
  extractCoboErrorMessage: vi.fn((err: unknown) => err instanceof Error ? err.message : String(err)),
}))

import { checkTssReadiness } from '../server/utils/caw-tss-readiness'

function createState(): AppState {
  return {
    wallet: { address: '', totalAssetsUsdc: 0, currentApy: 0, cumulativeYieldUsdc: 0 },
    walletPreparation: {
      network: 'base-sepolia',
      eoa: { connected: true, address: '0xEoa', label: 'Demo EOA' },
      agentWallet: { created: false, address: '', coboWalletId: 'wallet-1' },
      funding: { status: 'idle', depositedUsdc: 0, availableUsdc: 0, lastTxHash: null },
      agentBootstrap: {
        mode: 'sdk-create',
        phase: 'bootstrapping',
        sessionId: null,
        walletStatus: 'preparing',
        tssOnline: true,
        message: null,
      },
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
      apiKeyConfigured: true,
      coboApiKey: 'env-key',
      defaultAgentFee: 10,
      userSplit: 90,
    },
  }
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
  getWalletNodeStatus.mockReset()
})

describe('checkTssReadiness authorization edge cases', () => {
  it('does not block sdk-create preparing wallets when node status is rejected as pact-scoped authorization', async () => {
    vi.stubEnv('AGENT_WALLET_MAIN_NODE_ID', 'node-remote-1')
    getWalletNodeStatus.mockRejectedValue(new Error('403 Forbidden {"success":false,"error":"API key pact authorization is not authorized for this wallet"}'))

    const readiness = await checkTssReadiness(createState(), 'wallet-1')

    expect(readiness.online).toBe(true)
    expect(readiness.nodeId).toBe('node-remote-1')
    expect(readiness.source).toBe('sdk-remote')
    expect(readiness.message).toContain('远程 TSS Node')
  })

  it('does not block sdk-create preparing wallets when the pact-scoped authorization error was localized', async () => {
    vi.stubEnv('AGENT_WALLET_MAIN_NODE_ID', 'node-remote-1')
    getWalletNodeStatus.mockRejectedValue(new Error('当前 API Key 无权为该 Agent Wallet 提交 Pact。请确认 Wallet 步骤 2 已完成配对，并使用对应 Agent 的 API Key。'))

    const readiness = await checkTssReadiness(createState(), 'wallet-1')

    expect(readiness.online).toBe(true)
    expect(readiness.nodeId).toBe('node-remote-1')
    expect(readiness.source).toBe('sdk-remote')
    expect(readiness.message).toContain('远程 TSS Node')
  })
})
