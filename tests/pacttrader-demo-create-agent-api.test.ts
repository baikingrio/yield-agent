import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AppState } from '../shared/types/app'
import { applyPresetDemoWallet } from '../server/utils/pacttrader-demo-wallet'
import { createInitialState } from '../server/fixtures/initial-state'

const { getState, flushCurrentState, createCoboAgentWallet } = vi.hoisted(() => ({
  getState: vi.fn<() => AppState>(),
  flushCurrentState: vi.fn(),
  createCoboAgentWallet: vi.fn(),
}))

vi.stubGlobal('defineEventHandler', <T>(fn: T) => fn)

vi.mock('../server/utils/app-store', () => ({ getState, flushCurrentState }))
vi.mock('../server/utils/cobo-preparation', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../server/utils/cobo-preparation')>()
  return { ...actual, createCoboAgentWallet }
})
vi.mock('../server/utils/cobo-client', () => ({ CoboNotConfiguredError: class CoboNotConfiguredError extends Error {} }))

describe('POST /api/wallet/preparation/create-agent in demo preset mode', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns the pre-paired demo wallet without creating another CAW wallet', async () => {
    const state = createInitialState()
    applyPresetDemoWallet(state, {
      PACTTRADER_DEMO_MODE: 'preset',
      PACTTRADER_DEMO_CAW_WALLET_ID: 'e7495f9d-22bf-40f3-94d7-0733176b70ff',
    })
    getState.mockReturnValue(state)

    const handler = (await import('../server/api/wallet/preparation/create-agent.post')).default
    const result = await handler({} as never)

    expect(result.done).toBe(true)
    expect(result.preparation.demoMode).toBe('preset')
    expect(result.bootstrap?.phase).toBe('paired')
    expect(createCoboAgentWallet).not.toHaveBeenCalled()
    expect(flushCurrentState).not.toHaveBeenCalled()
  })
})
