import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createInitialState } from '../server/fixtures/initial-state'

const ensureAgentWalletEvmAddress = vi.hoisted(() => vi.fn())
const syncFundingFromExistingBalance = vi.hoisted(() => vi.fn())

vi.mock('../server/utils/agent-wallet-address', () => ({
  ensureAgentWalletEvmAddress,
}))

vi.mock('../server/utils/cobo-preparation', () => ({
  syncFundingFromExistingBalance,
}))

import {
  applyPresetDemoWallet,
  getPresetDemoWalletConfig,
  hydratePresetDemoWalletFromCobo,
} from '../server/utils/pacttrader-demo-wallet'

beforeEach(() => {
  vi.clearAllMocks()
  ensureAgentWalletEvmAddress.mockResolvedValue('0x382a91e60038085bc07e6f1e32739dcfa816c5a1')
  syncFundingFromExistingBalance.mockImplementation(async (state) => {
    state.walletPreparation.funding = {
      status: 'ready',
      depositedUsdc: 10,
      availableUsdc: 10,
      lastTxHash: null,
    }
    state.walletPreparation.steps.funding = 'completed'
    state.wallet.totalAssetsUsdc = 10
    return state.walletPreparation
  })
})

describe('PactTrader preset demo wallet', () => {
  it('does not modify state when preset demo mode is not enabled', () => {
    const state = createInitialState()
    const result = applyPresetDemoWallet(state, {})

    expect(result.applied).toBe(false)
    expect(state.walletPreparation.ready).toBe(false)
  })

  it('does not apply without a real Cobo wallet UUID', () => {
    const state = createInitialState()
    const result = applyPresetDemoWallet(state, { PACTTRADER_DEMO_MODE: 'preset' })

    expect(result.applied).toBe(false)
    expect(state.walletPreparation.demoMode).toBeUndefined()
  })

  it('applies structure from wallet UUID without placeholder addresses or balances', () => {
    const state = createInitialState()
    const result = applyPresetDemoWallet(state, {
      PACTTRADER_DEMO_MODE: 'preset',
      PACTTRADER_DEMO_CAW_WALLET_ID: 'e7495f9d-22bf-40f3-94d7-0733176b70ff',
      PACTTRADER_DEMO_EOA_ADDRESS: '0x911984b11dF9B7Ad75e4CaDC9BEfAb7bC7830936',
    })

    expect(result.applied).toBe(true)
    expect(state.wallet.address).toBe('')
    expect(state.wallet.totalAssetsUsdc).toBe(0)
    expect(state.walletPreparation.ready).toBe(false)
    expect(state.walletPreparation.demoMode).toBe('preset')
    expect(state.walletPreparation.agentWallet).toMatchObject({
      coboWalletId: 'e7495f9d-22bf-40f3-94d7-0733176b70ff',
    })
    expect(state.walletPreparation.eoa).toMatchObject({
      connected: true,
      address: '0x911984b11dF9B7Ad75e4CaDC9BEfAb7bC7830936',
    })
    expect(state.walletPreparation.steps.funding).toBe('pending')
  })

  it('hydrates EVM address and USDC balance from Cobo', async () => {
    const state = createInitialState()
    process.env.PACTTRADER_DEMO_MODE = 'preset'
    process.env.PACTTRADER_DEMO_CAW_WALLET_ID = 'e7495f9d-22bf-40f3-94d7-0733176b70ff'
    process.env.PACTTRADER_DEMO_EOA_ADDRESS = '0x911984b11dF9B7Ad75e4CaDC9BEfAb7bC7830936'

    const hydrated = await hydratePresetDemoWalletFromCobo(state)

    expect(hydrated).toBe(true)
    expect(ensureAgentWalletEvmAddress).toHaveBeenCalled()
    expect(syncFundingFromExistingBalance).toHaveBeenCalled()
    expect(state.walletPreparation.agentWallet.address).toBe('0x382a91e60038085bc07e6f1e32739dcfa816c5a1')
    expect(state.walletPreparation.ready).toBe(true)
    expect(state.wallet.totalAssetsUsdc).toBe(10)

    delete process.env.PACTTRADER_DEMO_MODE
    delete process.env.PACTTRADER_DEMO_CAW_WALLET_ID
    delete process.env.PACTTRADER_DEMO_EOA_ADDRESS
  })

  it('enables preset mode when demo wallet UUID is configured', () => {
    const config = getPresetDemoWalletConfig({
      PACTTRADER_DEMO_CAW_WALLET_ID: 'e7495f9d-22bf-40f3-94d7-0733176b70ff',
    })

    expect(config.enabled).toBe(true)
    expect(config.coboWalletId).toBe('e7495f9d-22bf-40f3-94d7-0733176b70ff')
  })
})
