import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AppState } from '../shared/types/app'

const getState = vi.fn<() => AppState>()
const probeCawDeployment = vi.fn()
const buildCawOnboardStatusFromState = vi.fn()
const getCawOnboardStatus = vi.fn()

vi.stubGlobal('defineEventHandler', <T>(fn: T) => fn)
vi.stubGlobal('getQuery', (event: { query?: Record<string, string> }) => event.query ?? {})
vi.stubGlobal('createError', (payload: unknown) => payload)

vi.mock('../server/utils/app-store', () => ({ getState }))
vi.mock('../server/utils/caw-deployment-probe', () => ({ probeCawDeployment }))
vi.mock('../server/utils/caw-onboard', () => ({
  buildCawOnboardStatusFromState,
  getCawOnboardStatus,
}))

function createState(): AppState {
  return {
    wallet: { address: '0xAgent', totalAssetsUsdc: 0, currentApy: 0, cumulativeYieldUsdc: 0 },
    walletPreparation: {
      network: 'base-sepolia',
      eoa: { connected: true, address: '0xEoa', label: 'EOA' },
      agentWallet: { created: true, address: '0xAgent', coboWalletId: 'wallet-1' },
      funding: { status: 'ready', depositedUsdc: 0, availableUsdc: 0, lastTxHash: null },
      steps: { eoa: 'completed', agent_wallet: 'completed', funding: 'completed' },
      ready: true,
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

describe('CAW settings API handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getState.mockReturnValue(createState())
    probeCawDeployment.mockResolvedValue({
      tssOnline: true,
      boundTssNodeId: 'node-1',
      walletStatus: 'active',
    })
    buildCawOnboardStatusFromState.mockReturnValue({ phase: 'active', walletUuid: 'wallet-1' })
    getCawOnboardStatus.mockResolvedValue({ phase: 'active', walletUuid: 'wallet-1', agentName: 'YieldAgent' })
  })

  it('deployment-check returns local summary without live probe by default', async () => {
    const handler = (await import('../server/api/caw/deployment-check.get')).default
    const result = await handler({} as never)

    expect(result.blockers).toBeDefined()
    expect(probeCawDeployment).not.toHaveBeenCalled()
  })

  it('deployment-check probes Cobo when sync=true', async () => {
    const handler = (await import('../server/api/caw/deployment-check.get')).default
    await handler({ query: { sync: 'true' } } as never)

    expect(probeCawDeployment).toHaveBeenCalled()
  })

  it('onboard status returns local snapshot without CLI by default', async () => {
    const handler = (await import('../server/api/caw/onboard/status.get')).default
    const result = await handler({} as never)

    expect(result).toEqual({ phase: 'active', walletUuid: 'wallet-1' })
    expect(buildCawOnboardStatusFromState).toHaveBeenCalled()
    expect(getCawOnboardStatus).not.toHaveBeenCalled()
  })

  it('onboard status calls CLI when sync=true', async () => {
    const handler = (await import('../server/api/caw/onboard/status.get')).default
    await handler({ query: { sync: 'true' } } as never)

    expect(getCawOnboardStatus).toHaveBeenCalled()
  })
})
