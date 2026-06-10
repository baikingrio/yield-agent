import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AppState } from '../shared/types/app'
import { applyPresetDemoWallet } from '../server/utils/pacttrader-demo-wallet'
import { createInitialState } from '../server/fixtures/initial-state'

const getState = vi.fn<() => AppState>()
const flushCurrentState = vi.fn()
const createCoboAgentWallet = vi.fn()

vi.stubGlobal('defineEventHandler', <T>(fn: T) => fn)

vi.mock('../server/utils/app-store', () => ({ getState, flushCurrentState }))
vi.mock('../server/utils/cobo-preparation', () => ({ createCoboAgentWallet }))
vi.mock('../server/utils/cobo-client', () => ({ CoboNotConfiguredError: class CoboNotConfiguredError extends Error {} }))

describe('POST /api/wallet/preparation/create-agent in demo preset mode', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns the pre-paired demo wallet without creating another CAW wallet', async () => {
    const state = createInitialState()
    applyPresetDemoWallet(state, {
      PACTTRADER_DEMO_MODE: 'preset',
      PACTTRADER_DEMO_AGENT_WALLET_ADDRESS: '0x2222222222222222222222222222222222222222',
    })
    getState.mockReturnValue(state)

    const handler = (await import('../server/api/wallet/preparation/create-agent.post')).default
    const result = await handler({} as never)

    expect(result.done).toBe(true)
    expect(result.preparation.demoMode).toBe('preset')
    expect(result.preparation.agentWallet.pairing?.status).toBe('paired')
    expect(createCoboAgentWallet).not.toHaveBeenCalled()
    expect(flushCurrentState).not.toHaveBeenCalled()
  })
})
