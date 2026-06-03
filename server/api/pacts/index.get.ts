import type { PactStatus } from '../../../shared/types/demo'
import { getState } from '../../utils/demo-store'

const STATUSES: PactStatus[] = ['pending', 'active', 'terminated', 'awaiting-approval']

export default defineEventHandler((event) => {
  const query = getQuery(event)
  const status = typeof query.status === 'string' ? query.status : undefined
  let pacts = getState().pacts

  if (status && STATUSES.includes(status as PactStatus)) {
    pacts = pacts.filter((p) => p.status === status)
  }

  return pacts
})
