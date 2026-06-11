import { afterEach, describe, expect, it } from 'vitest'
import { createInitialState } from '../server/fixtures/initial-state'
import { isLocalDraftAllowed } from '../server/utils/local-draft-policy'

afterEach(() => {
  delete process.env.CAW_FORCE_LOCAL_DRAFT
})

describe('isLocalDraftAllowed', () => {
  it('returns false by default', () => {
    const state = createInitialState()
    expect(isLocalDraftAllowed(state)).toBe(false)
  })

  it('returns false when developerMode is enabled in settings', () => {
    const state = createInitialState()
    state.settings.developerMode = true
    expect(isLocalDraftAllowed(state)).toBe(false)
  })

  it('returns true when CAW_FORCE_LOCAL_DRAFT env is set', () => {
    process.env.CAW_FORCE_LOCAL_DRAFT = 'true'
    const state = createInitialState()
    expect(isLocalDraftAllowed(state)).toBe(true)
  })
})
