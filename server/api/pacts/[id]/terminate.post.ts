import { getState, persistCurrentState } from '../../../utils/app-store'
import { createCoboPactsApi, extractCoboErrorMessage } from '../../../utils/cobo-client'
import {
  COBO_OWNER_REVOKE_MESSAGE,
  refreshCoboPactStatus,
  resolveCoboTerminateAction,
} from '../../../utils/cobo-pact'
import { revokeStoredPactCredential } from '../../../utils/pact-credentials'
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

  const action = resolveCoboTerminateAction(pact)

  if (action.type === 'owner_revoke_required') {
    throw createError({
      statusCode: 400,
      data: {
        error: COBO_OWNER_REVOKE_MESSAGE,
        code: 'COBO_OWNER_REVOKE_REQUIRED',
      },
    })
  }

  if (action.type === 'withdraw' && pact.coboPactId) {
    try {
      const pactsApi = createCoboPactsApi(state)
      await pactsApi.withdrawPact(pact.coboPactId)
    } catch (err) {
      throw createError({
        statusCode: 502,
        data: { error: extractCoboErrorMessage(err) },
      })
    }
    revokeStoredPactCredential(pact.id)
    try {
      const synced = await refreshCoboPactStatus(state, pact.id)
      persistCurrentState()
      return synced
    } catch {
      // Fall through to local terminated state if remote refresh fails after withdraw.
    }
  }

  if (pact.submissionMode === 'cobo') {
    revokeStoredPactCredential(pact.id)
  }

  pact.status = 'terminated'
  const strategy = state.strategies.find((s) => s.id === pact.strategyId)
  if (strategy) {
    strategy.status = 'paused'
  }

  persistCurrentState()
  return pact
})
