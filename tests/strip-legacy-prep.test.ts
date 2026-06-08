import { describe, expect, it, vi } from 'vitest'
import type { AppState } from '../shared/types/app'
import { isLegacyPrepFixture, stripLegacyPrepFixtures } from '../server/utils/strip-legacy-prep'
import * as persistence from '../server/utils/app-state-persistence'

function createState(prep: AppState['walletPreparation']): AppState {
  return {
    wallet: { address: '0xAgent', totalAssetsUsdc: 120, currentApy: 0, cumulativeYieldUsdc: 0 },
    walletPreparation: prep,
    strategies: [],
    pacts: [],
    logs: [],
    yieldSeries7d: [],
    yieldSeries30d: [],
    settings: { network: 'base-sepolia', apiKeyConfigured: false, defaultAgentFee: 15, userSplit: 85 },
  }
}

describe('strip legacy prep fixtures', () => {
  it('detects test fixture EOA and agent wallet', () => {
    const prep = {
      network: 'base-sepolia' as const,
      eoa: { connected: true, address: '0xEoa', label: 'Demo EOA' },
      agentWallet: { created: true, address: '0xAgent', coboWalletId: 'wallet-1' },
      funding: { status: 'ready' as const, depositedUsdc: 120, availableUsdc: 120, lastTxHash: null },
      steps: { eoa: 'completed' as const, agent_wallet: 'completed' as const, funding: 'completed' as const },
      ready: true,
      updatedAt: new Date(0).toISOString(),
    }

    expect(isLegacyPrepFixture(prep)).toBe(true)

    vi.spyOn(persistence, 'loadPersistedSession').mockReturnValue(null)
    const result = stripLegacyPrepFixtures(createState(prep))
    expect(result.changed).toBe(true)
    expect(result.source).toBe('reset')
    expect(result.state.walletPreparation.eoa.connected).toBe(false)
    expect(result.state.walletPreparation.eoa.address).toBeNull()
    expect(result.state.wallet.totalAssetsUsdc).toBe(0)
  })

  it('restores wallet prep from legacy json when fixture is detected', () => {
    const fixturePrep = {
      network: 'base-sepolia' as const,
      eoa: { connected: true, address: '0xEoa', label: 'Demo EOA' },
      agentWallet: { created: true, address: '0xAgent', coboWalletId: 'wallet-1' },
      funding: { status: 'ready' as const, depositedUsdc: 120, availableUsdc: 120, lastTxHash: null },
      steps: { eoa: 'completed' as const, agent_wallet: 'completed' as const, funding: 'completed' as const },
      ready: true,
      updatedAt: new Date(0).toISOString(),
    }
    const legacyPrep = {
      network: 'base-sepolia' as const,
      eoa: {
        connected: true,
        address: '0x911984b11dF9B7Ad75e4CaDC9BEfAb7bC7830936',
        label: 'Injected',
      },
      agentWallet: {
        created: true,
        address: '0xfbdc1f77d3ab2d42192fdd3962f4848efc0dc6bc',
        coboWalletId: '3752834b-c0fa-4f8d-b6b5-00b992d09923',
      },
      funding: { status: 'ready' as const, depositedUsdc: 10, availableUsdc: 10, lastTxHash: null },
      steps: { eoa: 'completed' as const, agent_wallet: 'completed' as const, funding: 'completed' as const },
      ready: true,
      updatedAt: new Date(0).toISOString(),
    }

    vi.spyOn(persistence, 'loadPersistedSession').mockReturnValue({
      walletPreparation: legacyPrep,
      settings: { network: 'base-sepolia', apiKeyConfigured: true, defaultAgentFee: 10, userSplit: 90 },
      wallet: { address: '0xfbdc1f77d3ab2d42192fdd3962f4848efc0dc6bc', totalAssetsUsdc: 10, currentApy: 0, cumulativeYieldUsdc: 0 },
    })

    const result = stripLegacyPrepFixtures(createState(fixturePrep))
    expect(result.source).toBe('legacy-json')
    expect(result.state.walletPreparation.eoa.address).toBe(legacyPrep.eoa.address)
    expect(result.state.walletPreparation.eoa.label).toBe('Injected')
  })

  it('keeps valid connected EOA untouched', () => {
    const prep = {
      network: 'base-sepolia' as const,
      eoa: {
        connected: true,
        address: '0x911984b11dF9B7Ad75e4CaDC9BEfAb7bC7830936',
        label: 'MetaMask',
      },
      agentWallet: { created: false, address: '', coboWalletId: null },
      funding: { status: 'idle' as const, depositedUsdc: 0, availableUsdc: 0, lastTxHash: null },
      steps: { eoa: 'completed' as const, agent_wallet: 'pending' as const, funding: 'pending' as const },
      ready: false,
      updatedAt: new Date(0).toISOString(),
    }

    expect(isLegacyPrepFixture(prep)).toBe(false)
    const result = stripLegacyPrepFixtures(createState(prep))
    expect(result.changed).toBe(false)
  })
})
