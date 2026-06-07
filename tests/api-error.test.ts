import { describe, expect, it } from 'vitest'
import { extractApiErrorMessage } from '../app/utils/api-error'

describe('extractApiErrorMessage', () => {
  it('reads nested h3 error payload from $fetch failures', () => {
    const err = {
      data: {
        error: true,
        statusCode: 502,
        data: { error: 'One or more recipe_slugs do not exist' },
      },
    }
    expect(extractApiErrorMessage(err)).toBe('One or more recipe_slugs do not exist')
  })

  it('reads flat error payloads', () => {
    const err = { data: { error: 'invalid_api_key' } }
    expect(extractApiErrorMessage(err)).toBe('invalid_api_key')
  })
})
