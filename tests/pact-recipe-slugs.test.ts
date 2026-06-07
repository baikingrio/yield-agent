import { describe, expect, it } from 'vitest'
import { resolvePactRecipeSlugs } from '../server/utils/cobo-pact'

describe('resolvePactRecipeSlugs', () => {
  it('returns empty list by default to avoid invalid placeholder slugs', () => {
    delete process.env.CAW_PACT_RECIPE_SLUGS
    expect(resolvePactRecipeSlugs('conservative')).toEqual([])
  })

  it('reads slugs from CAW_PACT_RECIPE_SLUGS', () => {
    process.env.CAW_PACT_RECIPE_SLUGS = ' slug-a , slug-b '
    expect(resolvePactRecipeSlugs('aggressive')).toEqual(['slug-a', 'slug-b'])
    delete process.env.CAW_PACT_RECIPE_SLUGS
  })
})
