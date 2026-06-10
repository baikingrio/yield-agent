import { getState, persistCurrentState } from '../../../utils/app-store'
import { refreshCoboPactStatus } from '../../../utils/cobo-pact'
import { isLocalDraftAllowed } from '../../../utils/local-draft-policy'
import { findPactById } from '../../../utils/pact-lookup'
import { pactResolveHttpError, resolvePactById } from '../../../utils/pact-resolve'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, data: { error: '缺少 Pact ID' } })
  }
  const state = getState()
  const hadLocal = Boolean(findPactById(state, id))
  let pact: Awaited<ReturnType<typeof resolvePactById>>
  try {
    pact = await resolvePactById(state, id, { importFromCobo: true })
  } catch (err) {
    const mapped = pactResolveHttpError(err)
    if (mapped) throw createError({ statusCode: mapped.statusCode, data: { error: mapped.error } })
    throw createError({ statusCode: 404, data: { error: 'Pact not found' } })
  }

  if (!pact) {
    throw createError({ statusCode: 404, data: { error: 'Pact not found' } })
  }

  if (!hadLocal) persistCurrentState()

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

  if (pact.submissionMode === 'local-draft' && !isLocalDraftAllowed(state)) {
    throw createError({
      statusCode: 403,
      data: { error: '本地 Pact 批准需在设置页开启开发者模式。' },
    })
  }

  pact.status = 'active'
  persistCurrentState()
  return pact
})
