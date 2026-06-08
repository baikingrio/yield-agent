import { describe, expect, it } from 'vitest'
import type { Pact } from '../shared/types/app'
import {
  isPactFilterTab,
  pactListFetchStatus,
  pactMatchesFilter,
  pactDisplayStatusLabel,
} from '../app/utils/pact-filter'

function pact(overrides: Partial<Pact> & Pick<Pact, 'status'>): Pact {
  return {
    id: 'pact-1',
    strategyId: 'str-1',
    intent: 'test',
    maxSpend: 10,
    whitelist: [],
    durationDays: 7,
    agentFeePercent: 10,
    userSplitPercent: 90,
    ...overrides,
  }
}

describe('pact filter tabs', () => {
  it('defaults to active tab validation', () => {
    expect(isPactFilterTab('active')).toBe(true)
    expect(isPactFilterTab('ended')).toBe(false)
    expect(isPactFilterTab(undefined)).toBe(false)
  })

  it('matches filter categories', () => {
    expect(pactMatchesFilter(pact({ status: 'active' }), 'active')).toBe(true)
    expect(pactMatchesFilter(pact({ status: 'awaiting-approval' }), 'awaiting-approval')).toBe(true)
    expect(pactMatchesFilter(pact({ status: 'pending' }), 'awaiting-approval')).toBe(true)
    expect(pactMatchesFilter(pact({ status: 'completed' }), 'completed')).toBe(true)
    expect(pactMatchesFilter(pact({ status: 'terminated', coboStatus: 'REJECTED' }), 'rejected')).toBe(true)
    expect(pactMatchesFilter(pact({ status: 'terminated', coboStatus: 'EXPIRED' }), 'expired')).toBe(true)
    expect(pactMatchesFilter(pact({ status: 'terminated', coboStatus: 'REVOKED' }), 'rejected')).toBe(false)
  })

  it('fetches full list for rejected and expired tabs', () => {
    expect(pactListFetchStatus('active')).toBe('active')
    expect(pactListFetchStatus('completed')).toBe('completed')
    expect(pactListFetchStatus('rejected')).toBeUndefined()
    expect(pactListFetchStatus('all')).toBeUndefined()
  })

  it('shows cobo-specific labels in list', () => {
    expect(pactDisplayStatusLabel(pact({ status: 'terminated', coboStatus: 'REJECTED' }))).toBe('已拒绝')
    expect(pactDisplayStatusLabel(pact({ status: 'active' }))).toBe('执行中')
  })
})
