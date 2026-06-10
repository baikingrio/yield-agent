import { describe, expect, it } from 'vitest'
import { createInitialState } from '../server/fixtures/initial-state'
import { applyPresetDemoWallet, getPresetDemoWalletConfig } from '../server/utils/pacttrader-demo-wallet'

describe('PactTrader preset demo wallet', () => {
  it('does not modify state when preset demo mode is not enabled', () => {
    const state = createInitialState()
    const result = applyPresetDemoWallet(state, {})

    expect(result.applied).toBe(false)
    expect(state.walletPreparation.ready).toBe(false)
    expect(state.walletPreparation.steps).toEqual({
      eoa: 'pending',
      agent_wallet: 'pending',
      funding: 'pending',
    })
  })

  it('marks the app ready with a paired funded demo wallet when preset mode is enabled', () => {
    const state = createInitialState()
    const result = applyPresetDemoWallet(state, {
      PACTTRADER_DEMO_MODE: 'preset',
      PACTTRADER_DEMO_AGENT_WALLET_ADDRESS: '0x2222222222222222222222222222222222222222',
      PACTTRADER_DEMO_CAW_WALLET_ID: 'demo-wallet-uuid',
      PACTTRADER_DEMO_AVAILABLE_USDC: '750',
      PACTTRADER_DEMO_EOA_ADDRESS: '0x1111111111111111111111111111111111111111',
    })

    expect(result.applied).toBe(true)
    expect(state.wallet.address).toBe('0x2222222222222222222222222222222222222222')
    expect(state.wallet.totalAssetsUsdc).toBe(750)
    expect(state.walletPreparation.ready).toBe(true)
    expect(state.walletPreparation.demoMode).toBe('preset')
    expect(state.walletPreparation.eoa).toMatchObject({
      connected: true,
      address: '0x1111111111111111111111111111111111111111',
      label: 'Hackathon Demo EOA',
    })
    expect(state.walletPreparation.agentWallet).toMatchObject({
      created: true,
      address: '0x2222222222222222222222222222222222222222',
      coboWalletId: 'demo-wallet-uuid',
      pairing: { status: 'paired', code: null, expiresAt: null },
    })
    expect(state.walletPreparation.steps).toEqual({
      eoa: 'completed',
      agent_wallet: 'completed',
      funding: 'completed',
    })
    expect(state.walletPreparation.agentBootstrap).toMatchObject({
      mode: 'sdk-create',
      phase: 'paired',
      walletStatus: 'active',
      tssOnline: true,
    })
  })

  it('enables preset mode when an explicit demo wallet address is configured', () => {
    const config = getPresetDemoWalletConfig({
      PACTTRADER_DEMO_AGENT_WALLET_ADDRESS: '0x3333333333333333333333333333333333333333',
    })

    expect(config.enabled).toBe(true)
    expect(config.agentWalletAddress).toBe('0x3333333333333333333333333333333333333333')
    expect(config.availableUsdc).toBe(500)
  })
})
