import { getState } from '../../utils/demo-store'
import { refreshCoboPactStatus } from '../../utils/cobo-pact'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const query = getQuery(event)
  const state = getState()
  const pact = state.pacts.find((p) => p.id === id || p.coboPactId === id)

  if (!pact) {
    throw createError({ statusCode: 404, statusMessage: 'Pact not found', data: { error: 'Pact not found' } })
  }

  if (query.sync === 'true' && pact.submissionMode === 'cobo') {
    try {
      return await refreshCoboPactStatus(state, pact.id)
    } catch (err) {
      throw createError({
        statusCode: 502,
        data: { error: err instanceof Error ? err.message : 'Cobo Pact 状态同步失败' },
      })
    }
  }

  return pact
})
