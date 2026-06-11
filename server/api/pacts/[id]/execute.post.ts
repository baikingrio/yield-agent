import { getQuery } from 'h3'
import { getState, persistCurrentState } from '../../../utils/app-store'
import { extractCoboErrorMessage } from '../../../utils/cobo-client'
import { refreshCoboPactStatus } from '../../../utils/cobo-pact'
import { executeFirstPactRecipe } from '../../../utils/cobo-execution'
import { isCoboSubmittedPact, pactExecutionBlockedReason } from '../../../utils/pact-execution-guard'
import {
  executionCredentialErrorMessage,
  refreshPactCredentialFromCobo,
  resolveExecutionCredentials,
} from '../../../utils/pact-credentials'
import { findPactById } from '../../../utils/pact-lookup'
import { pactResolveHttpError, resolvePactById } from '../../../utils/pact-resolve'

export const maxDuration = 60

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

  const blocked = pactExecutionBlockedReason(pact)
  if (blocked) {
    throw createError({ statusCode: 400, data: { error: blocked } })
  }

  if (!isCoboSubmittedPact(pact)) {
    throw createError({
      statusCode: 400,
      data: { error: '此 Pact 未通过 Cobo 提交，无法执行 Recipe。' },
    })
  }

  try {
    await refreshCoboPactStatus(state, pact.id)
    persistCurrentState()
  } catch (err) {
    throw createError({
      statusCode: 502,
      data: { error: extractCoboErrorMessage(err) },
    })
  }

  const blockedAfterSync = pactExecutionBlockedReason(pact)
  if (blockedAfterSync) {
    throw createError({ statusCode: 400, data: { error: blockedAfterSync } })
  }

  let executionApiKey = resolveExecutionCredentials(state, pact)?.apiKey ?? null
  if (!executionApiKey) {
    await refreshPactCredentialFromCobo(state, pact.id).catch(() => null)
    persistCurrentState()
    executionApiKey = resolveExecutionCredentials(state, pact)?.apiKey ?? null
  }
  if (!executionApiKey) {
    throw createError({
      statusCode: 502,
      data: { error: executionCredentialErrorMessage(state, pact) },
    })
  }

  if (getQuery(event).bumpAttempt === 'true' && !pact.firstExecutionCompleted) {
    pact.firstExecutionAttempt = (pact.firstExecutionAttempt ?? 0) + 1
    pact.firstExecutionCompleted = false
    pact.firstExecutionTxHash = ''
    persistCurrentState()
  }

  try {
    const result = await executeFirstPactRecipe(state, pact.id)
    persistCurrentState()
    return result
  } catch (err) {
    throw createError({
      statusCode: 502,
      data: { error: err instanceof Error ? err.message : 'Recipe 执行失败' },
    })
  }
})
