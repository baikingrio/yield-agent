import { describe, expect, it } from 'vitest'
import type { Pact } from '../shared/types/demo'
import { isCoboSubmittedPact, pactExecutionBlockedReason } from '../server/utils/pact-execution-guard'

const basePact: Pact = {
  id: 'pact-local-1',
  strategyId: 'str-local-1',
  intent: '测试',
  status: 'active',
  maxSpend: 100,
  whitelist: [],
  durationDays: 7,
  agentFeePercent: 10,
  userSplitPercent: 90,
}

const coboPact: Pact = {
  ...basePact,
  id: '82ea72e8-289a-43be-aeb9-a350cad878bf',
  submissionMode: 'cobo',
  coboPactId: '82ea72e8-289a-43be-aeb9-a350cad878bf',
}

describe('pact execution guard', () => {
  it('rejects local-draft pacts', () => {
    const localDraft = { ...basePact, submissionMode: 'local-draft' as const }
    expect(isCoboSubmittedPact(localDraft)).toBe(false)
    expect(pactExecutionBlockedReason(localDraft)).toContain('本地 draft')
  })

  it('accepts cobo-submitted pacts', () => {
    expect(isCoboSubmittedPact(coboPact)).toBe(true)
    expect(pactExecutionBlockedReason({ ...coboPact, status: 'active' })).toBeNull()
  })
})
