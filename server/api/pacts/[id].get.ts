import { getState, persistCurrentState } from '../../utils/app-store'
import { refreshCoboPactStatus } from '../../utils/cobo-pact'
import { findPactById } from '../../utils/pact-lookup'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const query = getQuery(event)
  const state = getState()
  const pact = id ? findPactById(state, id) : undefined

  if (!pact) {
    throw createError({ statusCode: 404, statusMessage: 'Pact not found', data: { error: 'Pact not found' } })
  }

  if (query.sync === 'true' && pact.submissionMode === 'cobo') {
    try {
      const synced = await refreshCoboPactStatus(state, pact.id)
      persistCurrentState()
      return synced
    } catch (err) {
      throw createError({
        statusCode: 502,
        data: { error: err instanceof Error ? err.message : 'Cobo Pact 状态同步失败' },
      })
    }
  }

  return pact
})
