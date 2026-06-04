import { z } from 'zod'
import type { NetworkId, Pact, Strategy } from '../../../shared/types/demo'
import { DEMO_TX_HASH } from '../../fixtures/initial-state'
import { getState } from '../../utils/demo-store'

const RISK_NAMES: Record<string, string> = {
  conservative: '保守型收益',
  balanced: '平衡型收益',
  aggressive: '激进型收益',
}

const NETWORK_NAMES: Record<NetworkId, string> = {
  'base-sepolia': 'Base Sepolia 测试网',
  'arbitrum-sepolia': 'Arbitrum Sepolia 测试网',
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
  const apyPart = data.targetApy?.trim() ? `，目标 APY ${data.targetApy}%` : ''
  const intent = `${riskLabel} · ${data.asset}（${NETWORK_NAMES[data.network]}）${apyPart}`

  const whitelist =
    data.riskLevel === 'aggressive'
      ? ['Aave 存入', 'Compound 存入', 'Uniswap 兑换']
      : ['Aave 存入', 'Compound 存入']

  const strategy: Strategy = {
    id: strategyId,
    name: `${riskLabel} · ${data.asset}`,
    network: data.network,
    asset: data.asset,
    riskLevel: data.riskLevel,
    maxSpend,
    status: 'active',
    pactId,
    createdAt: new Date().toISOString(),
  }

  const pact: Pact = {
    id: pactId,
    strategyId,
    intent,
    status: 'awaiting-approval',
    maxSpend,
    whitelist,
    durationDays: 7,
    agentFeePercent: agentFee,
    userSplitPercent: userSplit,
  }

  state.strategies.push(strategy)
  state.pacts.push(pact)
  state.logs.unshift({
    id: `log-${ts}`,
    timestamp: new Date().toISOString(),
    action: 'Pact 已创建，等待审批',
    type: 'supply',
    txHash: DEMO_TX_HASH,
    status: '待审批',
  })

  setResponseStatus(event, 201)
  return { strategy, pact }
})
