import type { PactStatus } from '../../../shared/types/app'
import { getState, persistCurrentState } from '../../utils/app-store'
import { refreshCoboPactStatus } from '../../utils/cobo-pact'

const STATUSES: PactStatus[] = ['pending', 'active', 'completed', 'terminated', 'awaiting-approval']

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const status = typeof query.status === 'string' ? query.status : undefined
  const state = getState()

  if (query.sync === 'true') {
    await Promise.all(
      state.pacts
        .filter((pact) => pact.submissionMode === 'cobo')
        .map(async (pact) => {
          try {
            await refreshCoboPactStatus(state, pact.id)
          } catch {
            // Keep the endpoint useful in demo mode even if one remote Cobo sync fails.
          }
        }),
    )
    persistCurrentState()
  }

  let pacts = state.pacts

  if (status && STATUSES.includes(status as PactStatus)) {
    pacts = pacts.filter((p) => p.status === status)
  }

  return pacts
})
