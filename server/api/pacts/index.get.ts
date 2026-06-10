import type { PactStatus } from '../../../shared/types/app'
import { getState, persistCurrentState } from '../../utils/app-store'
import { refreshCoboPactStatus } from '../../utils/cobo-pact'

const STATUSES: PactStatus[] = ['pending', 'active', 'completed', 'terminated', 'awaiting-approval']

/** Only these need remote refresh on list sync; completed/terminated are stable. */
const LIVE_SYNC_STATUSES = new Set<PactStatus>(['pending', 'active', 'awaiting-approval'])

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const status = typeof query.status === 'string' ? query.status : undefined
  const state = getState()

  if (query.sync === 'true') {
    let toSync = state.pacts.filter(
      (pact) => pact.submissionMode === 'cobo' && LIVE_SYNC_STATUSES.has(pact.status),
    )
    if (status && STATUSES.includes(status as PactStatus)) {
      toSync = toSync.filter((p) => p.status === status)
    }
    await Promise.all(
      toSync.map(async (pact) => {
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
