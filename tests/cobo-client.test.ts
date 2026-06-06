import { describe, expect, it } from 'vitest'
import { extractCoboErrorMessage, isTransientCoboNetworkError, withCoboRetry } from '../server/utils/cobo-client'

describe('cobo client network helpers', () => {
  it('detects transient network errors', () => {
    expect(isTransientCoboNetworkError({ code: 'ECONNRESET', message: 'read ECONNRESET' })).toBe(true)
    expect(isTransientCoboNetworkError(new Error('socket hang up'))).toBe(true)
    expect(isTransientCoboNetworkError(new Error('WALLET_STILL_PREPARING'))).toBe(false)
  })

  it('maps transient network errors to a friendly message', () => {
    expect(extractCoboErrorMessage({ code: 'ECONNRESET', message: 'read ECONNRESET' }))
      .toContain('连接 Cobo API 被中断')
  })

  it('retries transient network failures', async () => {
    let attempts = 0
    const result = await withCoboRetry(async () => {
      attempts += 1
      if (attempts < 2) {
        throw Object.assign(new Error('read ECONNRESET'), { code: 'ECONNRESET' })
      }
      return 'ok'
    }, { maxAttempts: 3, baseDelayMs: 1 })

    expect(result).toBe('ok')
    expect(attempts).toBe(2)
  })
})
