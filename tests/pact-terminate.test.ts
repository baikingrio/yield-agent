import { describe, expect, it } from 'vitest'
import type { Pact } from '../shared/types/app'
import { resolveCoboTerminateAction } from '../server/utils/cobo-pact'

const basePact: Pact = {
  id: 'pact-1',
  strategyId: 'str-1',
  intent: '测试',
  status: 'active',
  maxSpend: 10,
  whitelist: [],
  durationDays: 7,
  agentFeePercent: 15,
  userSplitPercent: 85,
  submissionMode: 'cobo',
  coboPactId: 'pact-1',
}

describe('resolveCoboTerminateAction', () => {
  it('requires owner revoke for active cobo pacts', () => {
    expect(resolveCoboTerminateAction(basePact)).toEqual({ type: 'owner_revoke_required' })
  })

  it('withdraws pending cobo pacts via agent API', () => {
    expect(resolveCoboTerminateAction({ ...basePact, status: 'awaiting-approval' })).toEqual({
      type: 'withdraw',
    })
  })

  it('terminates local draft locally', () => {
    expect(resolveCoboTerminateAction({ ...basePact, submissionMode: 'local-draft' })).toEqual({
      type: 'local_only',
    })
  })
})
