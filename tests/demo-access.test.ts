import { describe, expect, it } from 'vitest'
import type { WalletPreparation } from '../shared/types/app'
import { canEnterDashboard, landingPrimaryCta } from '../shared/utils/demo-access'

function prep(overrides: Partial<WalletPreparation> = {}): WalletPreparation {
  return {
    network: 'base-sepolia',
    eoa: { connected: false, address: null, label: '' },
    agentWallet: { created: false, address: '', coboWalletId: null },
    funding: { status: 'idle', depositedUsdc: 0, availableUsdc: 0, lastTxHash: null },
    steps: { eoa: 'pending', agent_wallet: 'pending', funding: 'pending' },
    ready: false,
    updatedAt: new Date(0).toISOString(),
    ...overrides,
  }
}

describe('demo access helpers', () => {
  it('lets preset demo visitors enter the dashboard without a connected browser wallet', () => {
    expect(canEnterDashboard({
      preparation: prep({ demoMode: 'preset', ready: true }),
      browserWalletConnected: false,
    })).toBe(true)
  })

  it('still blocks non-demo visitors with no EOA or browser wallet', () => {
    expect(canEnterDashboard({
      preparation: prep(),
      browserWalletConnected: false,
    })).toBe(false)
  })

  it('uses Try Demo as the landing primary CTA', () => {
    expect(landingPrimaryCta({ preparation: null })).toEqual({
      label: 'Try Demo',
      href: '/dashboard',
    })
  })
})
