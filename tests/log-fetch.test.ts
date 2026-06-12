import { describe, expect, it } from 'vitest'
import type { LogEntry } from '../shared/types/app'
import { shouldReplaceLogs } from '../shared/utils/log-fetch'

const sample: LogEntry[] = [{
  id: 'log-1',
  timestamp: '2026-06-10T00:00:00Z',
  action: 'test',
  type: 'pact',
  txHash: '',
  status: 'ok',
}]

describe('shouldReplaceLogs', () => {
  it('replaces when the next payload has rows', () => {
    expect(shouldReplaceLogs([], sample, { background: true })).toBe(true)
  })

  it('keeps stale rows on empty background refresh', () => {
    expect(shouldReplaceLogs(sample, [], { background: true })).toBe(false)
  })

  it('allows empty replacement when explicitly requested', () => {
    expect(shouldReplaceLogs(sample, [], { allowEmpty: true })).toBe(true)
  })
})
