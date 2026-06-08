import { describe, expect, it } from 'vitest'
import type { LogEntry, LogType } from '../shared/types/app'

const LOG_TYPES: LogType[] = ['swap', 'supply', 'revenue', 'pact']

function filterLogs(
  logs: LogEntry[],
  query: { type?: string; pactId?: string; limit?: number },
): LogEntry[] {
  let result = [...logs].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  )
  if (query.type && LOG_TYPES.includes(query.type as LogType)) {
    result = result.filter((l) => l.type === query.type)
  }
  if (query.pactId) {
    result = result.filter((l) => l.pactId === query.pactId)
  }
  const limit = query.limit ?? 50
  return result.slice(0, limit)
}

describe('logs pactId filter', () => {
  const logs: LogEntry[] = [
    {
      id: 'log-1',
      timestamp: '2026-06-06T12:00:00.000Z',
      action: 'Pact 已提交',
      type: 'pact',
      txHash: '',
      status: '待审批',
      pactId: 'pact-a',
    },
    {
      id: 'log-2',
      timestamp: '2026-06-06T13:00:00.000Z',
      action: '执行预检',
      type: 'supply',
      txHash: '0xabc',
      status: '成功',
      pactId: 'pact-a',
    },
    {
      id: 'log-3',
      timestamp: '2026-06-06T14:00:00.000Z',
      action: '其他',
      type: 'pact',
      txHash: '',
      status: 'ok',
      pactId: 'pact-b',
    },
  ]

  it('filters by pactId', () => {
    const filtered = filterLogs(logs, { pactId: 'pact-a' })
    expect(filtered).toHaveLength(2)
    expect(filtered.every((l) => l.pactId === 'pact-a')).toBe(true)
  })

  it('combines pactId and type filters', () => {
    const filtered = filterLogs(logs, { pactId: 'pact-a', type: 'supply' })
    expect(filtered).toHaveLength(1)
    expect(filtered[0]?.id).toBe('log-2')
  })
})
