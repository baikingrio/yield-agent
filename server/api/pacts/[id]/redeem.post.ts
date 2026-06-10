import { getState, persistCurrentState } from '../../../utils/app-store'
import { redeemPactFunds } from '../../../utils/cobo-execution'
import { extractCoboErrorMessage } from '../../../utils/cobo-client'
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

  if (pact.submissionMode !== 'cobo') {
    throw createError({ statusCode: 400, data: { error: '仅 Cobo Pact 支持链上赎回' } })
  }

  try {
    const result = await redeemPactFunds(state, pact.id)
    persistCurrentState()
    return result
  } catch (err) {
    persistCurrentState()
    throw createError({
      statusCode: 502,
      data: { error: err instanceof Error ? err.message : extractCoboErrorMessage(err) },
    })
  }
})
