import { afterEach, describe, expect, it, vi } from 'vitest'
import type { AppState } from '../shared/types/app'

const bootstrapViaSdkCreate = vi.hoisted(() => vi.fn())
const getWalletStatusFromSdk = vi.hoisted(() => vi.fn())
const resolveEvmAddressFromSdk = vi.hoisted(() => vi.fn())

vi.mock('../server/utils/caw-sdk-wallet', () => ({
  bootstrapViaSdkCreate,
  getWalletStatusFromSdk,
  resolveEvmAddressFromSdk,
}))

vi.mock('../server/utils/caw-provision', () => ({
  provisionCawPrincipal: vi.fn(),
}))

import { pollAgentBootstrap } from '../server/utils/caw-wallet-bootstrap'
import * as cawTssReadiness from '../server/utils/caw-tss-readiness'

function createState(overrides: Partial<AppState['walletPreparation']> = {}): AppState {
  return {
    wallet: { address: '', totalAssetsUsdc: 0, currentApy: 0, cumulativeYieldUsdc: 0 },
    walletPreparation: {
      network: 'base-sepolia',
      eoa: { connected: true, address: '0xEoa', label: 'Demo EOA' },
      agentWallet: {
        created: false,
        address: '',
        coboWalletId: null,
        pairing: { status: 'unpaired', code: null, expiresAt: null },
      },
      funding: { status: 'idle', depositedUsdc: 0, availableUsdc: 0, lastTxHash: null },
      agentBootstrap: {
        mode: 'sdk-create',
        phase: 'idle',
        sessionId: null,
        walletStatus: null,
        tssOnline: true,
        message: '将使用远程 TSS Node 创建 MPC 钱包',
      },
      steps: { eoa: 'completed', agent_wallet: 'pending', funding: 'pending' },
      ready: false,
      updatedAt: new Date(0).toISOString(),
      ...overrides,
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
      defaultAgentFee: 10,
      userSplit: 90,
    },
  }
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
  bootstrapViaSdkCreate.mockReset()
  getWalletStatusFromSdk.mockReset()
  resolveEvmAddressFromSdk.mockReset()
})

function mockTssOnline(): void {
  vi.spyOn(cawTssReadiness, 'checkTssReadiness').mockResolvedValue({
    online: true,
    nodeId: 'node-remote-1',
    source: 'sdk-remote',
    message: '远程 TSS Node 在线',
  })
}

describe('pollAgentBootstrap sdk-create', () => {
  it('continues polling after SDK wallet creation instead of staying idle', async () => {
    vi.stubEnv('AGENT_WALLET_MAIN_NODE_ID', 'node-remote-1')
    vi.stubEnv('AGENT_WALLET_API_KEY', 'env-key')
    vi.stubEnv('CAW_CLI_BIN', '/tmp/missing-caw-bin')
    mockTssOnline()

    const state = createState()
    bootstrapViaSdkCreate.mockImplementation(async (s: AppState) => {
      s.walletPreparation.agentWallet.coboWalletId = 'wallet-new'
      s.walletPreparation.steps.agent_wallet = 'in_progress'
    })
    getWalletStatusFromSdk.mockResolvedValue('preparing')

    const response = await pollAgentBootstrap(state)

    expect(bootstrapViaSdkCreate).toHaveBeenCalledOnce()
    expect(getWalletStatusFromSdk).toHaveBeenCalledWith(state, 'wallet-new')
    expect(response.bootstrap?.phase).toBe('bootstrapping')
    expect(response.preparation.steps.agent_wallet).toBe('in_progress')
    expect(response.bootstrap?.message).not.toBe('将使用远程 TSS Node 创建 MPC 钱包')
  })

  it('advances idle bootstrap when coboWalletId already exists', async () => {
    vi.stubEnv('AGENT_WALLET_MAIN_NODE_ID', 'node-remote-1')
    vi.stubEnv('AGENT_WALLET_API_KEY', 'env-key')
    vi.stubEnv('CAW_CLI_BIN', '/tmp/missing-caw-bin')
    mockTssOnline()

    const state = createState({
      agentWallet: {
        created: false,
        address: '',
        coboWalletId: 'wallet-existing',
        pairing: { status: 'unpaired', code: null, expiresAt: null },
      },
    })
    getWalletStatusFromSdk.mockResolvedValue('preparing')

    const response = await pollAgentBootstrap(state)

    expect(bootstrapViaSdkCreate).not.toHaveBeenCalled()
    expect(response.bootstrap?.phase).toBe('bootstrapping')
    expect(response.preparation.steps.agent_wallet).toBe('in_progress')
  })
})
