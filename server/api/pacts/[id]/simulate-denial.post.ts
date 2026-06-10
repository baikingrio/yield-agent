import { getState, persistCurrentState } from '../../../utils/app-store'
import { simulatePactDenial } from '../../../utils/cobo-execution'
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

  try {
    const result = await simulatePactDenial(state, pact.id)
    persistCurrentState()
    return result
  } catch (err) {
    throw createError({
      statusCode: 502,
      data: { error: err instanceof Error ? err.message : '越权模拟失败' },
    })
  }
})
