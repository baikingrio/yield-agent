import { describe, expect, it } from 'vitest'
import { extractCoboErrorMessage, isInvalidApiKeyError } from '../server/utils/cobo-client'

describe('extractCoboErrorMessage', () => {
  it('humanizes invalid_api_key from Cobo response body', () => {
    const err = {
      response: {
        data: { error: 'invalid_api_key' },
      },
    }
    expect(extractCoboErrorMessage(err)).toContain('API Key 无效或已过期')
    expect(isInvalidApiKeyError(err)).toBe(true)
  })

  it('extracts FastAPI validation detail from 422 responses', () => {
    const err = {
      response: {
        data: {
          success: false,
          error: {
            detail: [
              {
                type: 'missing',
                loc: ['body', 'src_addr'],
                msg: 'Field required',
              },
            ],
          },
        },
      },
    }
    expect(extractCoboErrorMessage(err)).toBe('src_addr: Field required')
  })
})
