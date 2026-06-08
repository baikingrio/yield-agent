import { getState, persistCurrentState } from '../../../utils/app-store'
import { refreshCoboPactStatus } from '../../../utils/cobo-pact'
import { findPactById } from '../../../utils/pact-lookup'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, data: { error: '缺少 Pact ID' } })
  }
  const state = getState()
  const pact = findPactById(state, id)

  if (!pact) {
    throw createError({ statusCode: 404, data: { error: 'Pact not found' } })
  }

  if (pact.status === 'terminated') {
    throw createError({ statusCode: 400, data: { error: '已终止的 Pact 无法审批' } })
  }

  if (pact.submissionMode === 'cobo') {
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

  pact.status = 'active'
  persistCurrentState()
  return pact
})
