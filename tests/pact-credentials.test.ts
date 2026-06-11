import { afterEach, describe, expect, it } from 'vitest'
import type { Pact } from '../shared/types/app'
import { createInitialState } from '../server/fixtures/initial-state'
import { storePactCredential } from '../server/db/repository'
import {
  executionCredentialErrorMessage,
  resolveExecutionCredentials,
} from '../server/utils/pact-credentials'

function makePact(): Pact {
  return {
    id: 'pact-1',
    strategyId: 'str-1',
    intent: 'test',
    status: 'active',
    maxSpend: 5,
    whitelist: [],
    durationDays: 7,
    agentFeePercent: 15,
    userSplitPercent: 85,
    submissionMode: 'cobo',
    coboPactId: 'pact-1',
  }
}

afterEach(() => {
  delete process.env.AGENT_WALLET_API_KEY
  delete process.env.AGENT_WALLET_TSS_RUNTIME
  delete process.env.VERCEL
})

describe('resolveExecutionCredentials', () => {
  it('prefers principal key on Vercel split deploy', () => {
    process.env.VERCEL = '1'
    process.env.AGENT_WALLET_API_KEY = 'principal-key'
    const state = createInitialState()
    state.settings.coboApiKey = 'settings-key'

    const creds = resolveExecutionCredentials(state, makePact())
    expect(creds).toEqual({ apiKey: 'principal-key', mode: 'principal' })
  })

  it('uses pact-scoped key on local runtime when cached', () => {
    const state = createInitialState()
    state.settings.coboApiKey = 'settings-key'
    storePactCredential('pact-1', 'pact-scoped-key')

    const creds = resolveExecutionCredentials(state, makePact())
    expect(creds).toEqual({ apiKey: 'pact-scoped-key', mode: 'pact-scoped' })
  })

  it('explains principal key requirement for split deploy errors', () => {
    process.env.VERCEL = '1'
    const state = createInitialState()
    expect(executionCredentialErrorMessage(state, makePact())).toContain('AGENT_WALLET_API_KEY')
    expect(executionCredentialErrorMessage(state, makePact())).toContain('主 Key')
  })
})
