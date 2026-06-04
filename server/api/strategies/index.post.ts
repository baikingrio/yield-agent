import { z } from 'zod'
import type { Pact, Strategy } from '../../../shared/types/demo'
import { DEMO_TX_HASH } from '../../fixtures/initial-state'
import { getState } from '../../utils/demo-store'
import { buildYieldPactDraft, strategyWhitelist, submitYieldPactToCobo } from '../../utils/cobo-pact'
import type { CoboPactSubmitResult } from '../../utils/cobo-pact'

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
  const maxSpend = Number(data.maxSpend)
  const agentFee = Number(data.agentFee)
  const userSplit = Number(data.userSplit)

  if (!state.walletPreparation.ready) {
    throw createError({
      statusCode: 400,
      data: { error: '请先完成资金准备' },
    })
  }

  const available = state.walletPreparation.funding.availableUsdc

  if (
    Number.isNaN(maxSpend)
    || maxSpend < 10
    || maxSpend > 1_000_000
    || Number.isNaN(agentFee)
    || agentFee < 0
    || agentFee > 30
    || Number.isNaN(userSplit)
    || userSplit < 0
    || userSplit > 100
  ) {
    throw createError({
      statusCode: 400,
      data: { error: '金额或分成比例超出允许范围' },
    })
  }

  if (maxSpend > available) {
    throw createError({
      statusCode: 400,
      data: { error: `支出上限不能超过 Agent Wallet 可用余额（${available} USDC）` },
    })
  }

  const ts = Date.now()
  const strategyId = `str-${ts}`
  const pactId = `pact-${ts}`

  const riskLabel = RISK_NAMES[data.riskLevel] ?? data.riskLevel
  const draft = buildYieldPactDraft(data)
  const whitelist = strategyWhitelist(data.riskLevel)
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
  }

  state.strategies.push(strategy)
  state.pacts.push(pact)
  state.logs.unshift({
    id: `log-${ts}`,
    timestamp: new Date().toISOString(),
    action: submitResult.mode === 'cobo'
      ? 'Pact 已提交到 Cobo，等待 App 审批'
      : 'Pact draft 已创建，等待接入 Cobo 提交',
    type: 'supply',
    txHash: DEMO_TX_HASH,
    status: submitResult.status === 'active' ? '已激活' : '待审批',
  })

  setResponseStatus(event, 201)
  return { strategy, pact }
})
