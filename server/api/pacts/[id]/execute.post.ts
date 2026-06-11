import { getQuery } from 'h3'
import { getState, persistCurrentState } from '../../../utils/app-store'
import { extractCoboErrorMessage } from '../../../utils/cobo-client'
import { refreshCoboPactStatus } from '../../../utils/cobo-pact'
import { executeFirstPactRecipe } from '../../../utils/cobo-execution'
import { isCoboSubmittedPact, pactExecutionBlockedReason } from '../../../utils/pact-execution-guard'
import { refreshPactCredentialFromCobo, resolvePactExecutionApiKey } from '../../../utils/pact-credentials'
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

  let executionApiKey = resolvePactExecutionApiKey(state, pact.id)
  if (!executionApiKey) {
    executionApiKey = await refreshPactCredentialFromCobo(state, pact.id).catch(() => null)
    persistCurrentState()
  }
  if (!executionApiKey) {
    throw createError({
      statusCode: 502,
      data: {
        error: pact.status === 'completed'
          ? 'Pact 已在 Cobo 侧完成，无法继续执行。请重新创建策略与 Pact。'
          : '未找到 pact-scoped 执行凭证。请在 Cobo App 完成审批后，于 Pact 管理页点击「我已批准，刷新状态」再试。',
      },
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
