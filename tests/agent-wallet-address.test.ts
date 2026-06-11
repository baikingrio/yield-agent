import { afterEach, describe, expect, it, vi } from 'vitest'
import { createInitialState } from '../server/fixtures/initial-state'

const resolveEvmAddressFromSdk = vi.hoisted(() => vi.fn())

vi.mock('../server/utils/caw-sdk-wallet', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../server/utils/caw-sdk-wallet')>()
  return {
    ...actual,
    resolveEvmAddressFromSdk,
  }
})

import { ensureAgentWalletEvmAddress } from '../server/utils/agent-wallet-address'

afterEach(() => {
  vi.clearAllMocks()
  delete process.env.PACTTRADER_DEMO_MODE
  delete process.env.PACTTRADER_DEMO_CAW_WALLET_ID
})

describe('ensureAgentWalletEvmAddress', () => {
  it('replaces stale cached address with Cobo-resolved EVM address', async () => {
    process.env.PACTTRADER_DEMO_MODE = 'preset'
    process.env.PACTTRADER_DEMO_CAW_WALLET_ID = 'e7495f9d-22bf-40f3-94d7-0733176b70ff'

    resolveEvmAddressFromSdk.mockResolvedValue('0x382a91e60038085bc07e6f1e32739dcfa816c5a1')

    const state = createInitialState()
    state.walletPreparation.agentWallet.coboWalletId = 'e7495f9d-22bf-40f3-94d7-0733176b70ff'
    state.walletPreparation.agentWallet.address = '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef'

    const address = await ensureAgentWalletEvmAddress(state)

    expect(address).toBe('0x382a91e60038085bc07e6f1e32739dcfa816c5a1')
    expect(state.walletPreparation.agentWallet.address).toBe('0x382a91e60038085bc07e6f1e32739dcfa816c5a1')
    expect(resolveEvmAddressFromSdk).toHaveBeenCalledWith(state, 'e7495f9d-22bf-40f3-94d7-0733176b70ff')
  })
})
