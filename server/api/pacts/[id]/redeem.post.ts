import { getState, persistCurrentState } from '../../../utils/app-store'
import { extractCoboErrorMessage } from '../../../utils/cobo-client'
import { refreshCoboPactStatus } from '../../../utils/cobo-pact'
import { redeemPactFunds } from '../../../utils/cobo-execution'
import {
  refreshPactCredentialFromCobo,
  resolveRedeemApiKey,
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

  if (pact.submissionMode !== 'cobo') {
    throw createError({ statusCode: 400, data: { error: '仅 Cobo Pact 支持链上赎回' } })
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

  const apiKey = await resolveRedeemApiKey(state, pact)
  if (!apiKey) {
    throw createError({
      statusCode: 502,
      data: {
        error: pact.status === 'active'
          ? '未找到执行凭证。请配置 AGENT_WALLET_API_KEY（Agent 主 Key），或在 Pact 管理页刷新状态以同步 Pact 子 Key。'
          : 'Pact 已撤销且缺少 Agent 主 API Key，无法代为赎回。请在 Vercel 配置 AGENT_WALLET_API_KEY 后重试。',
      },
    })
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
