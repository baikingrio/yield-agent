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
  delete process.env.PACTTRADER_DEMO_AGENT_WALLET_ADDRESS
})

describe('ensureAgentWalletEvmAddress', () => {
  it('reuses cached address when wallet id is unchanged', async () => {
    const state = createInitialState()
    state.walletPreparation.agentWallet.coboWalletId = '9dacf436-5cd4-4ec4-a962-d9c92a2608c3'
    state.walletPreparation.agentWallet.address = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd'

    const address = await ensureAgentWalletEvmAddress(state)

    expect(address).toBe('0xabcdefabcdefabcdefabcdefabcdefabcdefabcd')
    expect(resolveEvmAddressFromSdk).not.toHaveBeenCalled()
  })

  it('uses pinned preset agent wallet address without calling Cobo', async () => {
    process.env.PACTTRADER_DEMO_MODE = 'preset'
    process.env.PACTTRADER_DEMO_CAW_WALLET_ID = '9dacf436-5cd4-4ec4-a962-d9c92a2608c3'
    process.env.PACTTRADER_DEMO_AGENT_WALLET_ADDRESS = '0x382a91e60038085bc07e6f1e32739dcfa816c5a1'

    const state = createInitialState()
    const address = await ensureAgentWalletEvmAddress(state)

    expect(address).toBe('0x382a91e60038085bc07e6f1e32739dcfa816c5a1')
    expect(resolveEvmAddressFromSdk).not.toHaveBeenCalled()
    expect(state.walletPreparation.agentWallet.created).toBe(true)
  })

  it('keeps cached address for the same wallet id without re-fetching Cobo', async () => {
    const state = createInitialState()
    state.walletPreparation.agentWallet.coboWalletId = 'e7495f9d-22bf-40f3-94d7-0733176b70ff'
    state.walletPreparation.agentWallet.address = '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef'

    const address = await ensureAgentWalletEvmAddress(state)

    expect(address).toBe('0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef')
    expect(resolveEvmAddressFromSdk).not.toHaveBeenCalled()
  })

  it('resolves from Cobo when no cached address exists', async () => {
    resolveEvmAddressFromSdk.mockResolvedValue('0x382a91e60038085bc07e6f1e32739dcfa816c5a1')

    const state = createInitialState()
    state.walletPreparation.agentWallet.coboWalletId = 'e7495f9d-22bf-40f3-94d7-0733176b70ff'

    const address = await ensureAgentWalletEvmAddress(state)

    expect(address).toBe('0x382a91e60038085bc07e6f1e32739dcfa816c5a1')
    expect(resolveEvmAddressFromSdk).toHaveBeenCalledWith(state, 'e7495f9d-22bf-40f3-94d7-0733176b70ff')
  })
})
