import { getState, persistCurrentState } from '../../utils/app-store'
import { refreshCoboPactStatus } from '../../utils/cobo-pact'
import { findPactById } from '../../utils/pact-lookup'
import { pactResolveHttpError, resolvePactById } from '../../utils/pact-resolve'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const query = getQuery(event)
  const state = getState()
  const hadLocal = Boolean(id && findPactById(state, id))

  let pact: Awaited<ReturnType<typeof resolvePactById>>
  try {
    pact = id
      ? await resolvePactById(state, id, { importFromCobo: query.sync === 'true' })
      : undefined
  } catch (err) {
    const mapped = pactResolveHttpError(err)
    if (mapped) throw createError({ statusCode: mapped.statusCode, data: { error: mapped.error } })
    throw createError({ statusCode: 404, statusMessage: 'Pact not found', data: { error: 'Pact not found' } })
  }

  if (!pact) {
    throw createError({ statusCode: 404, statusMessage: 'Pact not found', data: { error: 'Pact not found' } })
  }

  if (query.sync === 'true' && !hadLocal) {
    persistCurrentState()
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
