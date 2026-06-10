import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AppState } from '../shared/types/app'

const checkTssReadiness = vi.fn()
const getWalletStatusFromSdk = vi.fn()
const isCoboConfigured = vi.fn()

vi.mock('../server/utils/caw-tss-readiness', () => ({ checkTssReadiness }))
vi.mock('../server/utils/caw-sdk-wallet', () => ({ getWalletStatusFromSdk }))
vi.mock('../server/utils/cobo-client', () => ({ isCoboConfigured }))

function createState(): AppState {
  return {
    wallet: { address: '', totalAssetsUsdc: 0, currentApy: 0, cumulativeYieldUsdc: 0 },
    walletPreparation: {
      network: 'base-sepolia',
      eoa: { connected: true, address: '0xEoa', label: 'EOA' },
      agentWallet: { created: true, address: '0xAgent', coboWalletId: 'wallet-1' },
      funding: { status: 'idle', depositedUsdc: 0, availableUsdc: 0, lastTxHash: null },
      steps: { eoa: 'completed', agent_wallet: 'completed', funding: 'pending' },
      ready: false,
      updatedAt: new Date(0).toISOString(),
    },
    strategies: [],
    pacts: [],
    logs: [],
    yieldSeries7d: [],
    yieldSeries30d: [],
    settings: { network: 'base-sepolia', apiKeyConfigured: true, defaultAgentFee: 10, userSplit: 90 },
  }
}

describe('probeCawDeployment', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    isCoboConfigured.mockReturnValue(true)
    checkTssReadiness.mockResolvedValue({ online: true, nodeId: 'node-1', source: 'sdk-remote', message: 'ok' })
    getWalletStatusFromSdk.mockResolvedValue('active')
  })

  it('skips remote probes when wallet or API key is missing', async () => {
    isCoboConfigured.mockReturnValue(false)
    const { probeCawDeployment } = await import('../server/utils/caw-deployment-probe')
    const probe = await probeCawDeployment(createState())

    expect(probe).toEqual({ tssOnline: null, boundTssNodeId: null, walletStatus: null })
    expect(checkTssReadiness).not.toHaveBeenCalled()
  })

  it('runs TSS and wallet probes in parallel', async () => {
    let tssStarted = false
    checkTssReadiness.mockImplementation(async () => {
      tssStarted = true
      await new Promise((resolve) => setTimeout(resolve, 20))
      return { online: true, nodeId: 'node-1', source: 'sdk-remote', message: 'ok' }
    })
    getWalletStatusFromSdk.mockImplementation(async () => {
      expect(tssStarted).toBe(true)
      return 'preparing'
    })

    const { probeCawDeployment } = await import('../server/utils/caw-deployment-probe')
    const probe = await probeCawDeployment(createState())

    expect(probe).toEqual({
      tssOnline: true,
      boundTssNodeId: 'node-1',
      walletStatus: 'preparing',
    })
  })
})
