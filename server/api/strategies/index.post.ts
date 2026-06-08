import { z } from 'zod'
import type { Pact, Strategy } from '../../../shared/types/app'
import { getState, persistCurrentState } from '../../utils/app-store'
import { buildYieldPactDraft, strategyWhitelist, submitYieldPactToCobo } from '../../utils/cobo-pact'
import type { CoboPactSubmitResult } from '../../utils/cobo-pact'
import { validateStrategyPayload } from '../../utils/strategy-validator'

const RISK_NAMES: Record<string, string> = {
  conservative: '保守型收益',
  balanced: '平衡型收益',
  aggressive: '激进型收益',
}

const schema = z.object({
  network: z.enum(['base-sepolia', 'arbitrum-sepolia']),
  asset: z.string().min(1),
  targetApy: z.string().optional(),
  riskLevel: z.string().min(1),
  maxSpend: z.string().min(1),
  agentFee: z.string().min(1),
  userSplit: z.string().min(1),
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parsed = schema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      data: { error: '请求参数无效', code: 'VALIDATION_ERROR' },
    })
  }

  const state = getState()
  const data = parsed.data

  if (!state.walletPreparation.ready) {
    throw createError({
      statusCode: 400,
      data: { error: '请先完成资金准备' },
    })
  }

  const validation = validateStrategyPayload(state, data)
  if (!validation.valid) {
    const first = Object.values(validation.errors)[0] || '请求参数无效'
    throw createError({
      statusCode: 400,
      data: { error: first, code: 'VALIDATION_ERROR' },
    })
  }

  const maxSpend = Number(data.maxSpend)
  const agentFee = Number(data.agentFee)
  const userSplit = Number(data.userSplit)

  const ts = Date.now()
  const strategyId = `str-${ts}`
  const pactId = `pact-${ts}`

  const riskLabel = RISK_NAMES[data.riskLevel] ?? data.riskLevel
  const draft = buildYieldPactDraft(data)
  const whitelist = strategyWhitelist(data.riskLevel, data.network)

  let submitResult: CoboPactSubmitResult
  try {
    submitResult = await submitYieldPactToCobo(state, data, pactId)
  } catch (err) {
    throw createError({
      statusCode: 502,
      data: { error: err instanceof Error ? err.message : 'Cobo Pact 提交失败' },
    })
  }

  const strategy: Strategy = {
    id: strategyId,
    name: `${riskLabel} · ${data.asset}`,
    network: data.network,
    asset: data.asset,
    riskLevel: data.riskLevel,
    maxSpend,
    status: 'active',
    pactId: submitResult.pactId,
    createdAt: new Date().toISOString(),
  }

  const pact: Pact = {
    id: submitResult.pactId,
    strategyId,
    intent: draft.intent,
    status: submitResult.status,
    maxSpend,
    whitelist,
    durationDays: 7,
    agentFeePercent: agentFee,
    userSplitPercent: userSplit,
    submissionMode: submitResult.mode,
    coboPactId: submitResult.mode === 'cobo' ? submitResult.pactId : undefined,
    approvalId: submitResult.approvalId,
    coboStatus: submitResult.coboStatus,
    submissionMessage: submitResult.message,
    executionCredentialStored: submitResult.status === 'active',
    firstExecutionCompleted: false,
  }

  state.strategies.push(strategy)
  state.pacts.push(pact)
  state.logs.unshift({
    id: `log-${ts}`,
    timestamp: new Date().toISOString(),
    action: submitResult.mode === 'cobo'
      ? 'Pact 已提交到 Cobo，等待 App 审批'
      : 'Pact draft 已创建（本地降级模式）',
    type: 'pact',
    txHash: '',
    status: submitResult.status === 'active' ? '已激活' : '待审批',
    pactId: pact.id,
  })

  persistCurrentState()
  setResponseStatus(event, 201)
  return { strategy, pact }
})
