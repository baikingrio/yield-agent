import type { NetworkId } from '#shared/types/app'

export type RiskLevel = 'conservative' | 'balanced' | 'aggressive'

export type StrategyTemplateKey = 'conservative-usdc' | 'balanced-supply' | 'custom'

export type PipelineStage =
  | 'configure'
  | 'preview-ready'
  | 'submitting'
  | 'awaiting-approval'
  | 'executing'
  | 'success'
  | 'failed'

export interface StrategyForm {
  network: NetworkId
  asset: string
  targetApy: string
  riskLevel: RiskLevel
  maxSpend: string
  agentFee: string
  userSplit: string
}

export const RISK_LABELS: Record<RiskLevel, string> = {
  conservative: '保守型收益',
  balanced: '平衡型收益',
  aggressive: '激进型收益',
}

export const DEFAULT_FORM: StrategyForm = {
  network: 'base-sepolia',
  asset: 'USDC',
  targetApy: '',
  riskLevel: 'conservative',
  maxSpend: '500',
  agentFee: '15',
  userSplit: '85',
}

export const TEMPLATE_PRESETS: Record<StrategyTemplateKey, {
  title: string
  description: string
  nlText: string
  form: StrategyForm
  comingSoon?: boolean
}> = {
  'conservative-usdc': {
    title: '保守型 USDC 收益',
    description: '首次体验推荐：最多 500 USDC，只允许 Aave / Compound Supply。',
    nlText: '我想在 Base Sepolia 上用 500 USDC 做一个保守收益策略，只允许 Aave 和 Compound，期限 7 天，收益 85% 给我，15% 给 Agent。',
    form: { ...DEFAULT_FORM, riskLevel: 'conservative', maxSpend: '500', targetApy: '8' },
  },
  'balanced-supply': {
    title: '平衡型收益策略',
    description: '允许小额调整，但仍受预算、白名单协议和期限限制。',
    nlText: '我想在 Base Sepolia 上用 800 USDC 做一个平衡收益策略，允许小额兑换后存入 Aave 或 Compound，收益 88% 给我，12% 给 Agent。',
    form: { ...DEFAULT_FORM, riskLevel: 'balanced', maxSpend: '800', agentFee: '12', userSplit: '88' },
  },
  custom: {
    title: '自定义策略',
    description: '自然语言描述策略目标（待实现）。',
    nlText: '',
    form: { ...DEFAULT_FORM },
    comingSoon: true,
  },
}

export const STRATEGY_TEMPLATES = Object.entries(TEMPLATE_PRESETS).map(([key, value]) => ({
  key: key as StrategyTemplateKey,
  title: value.title,
  description: value.description,
  comingSoon: value.comingSoon === true,
}))

export function stepIndexFromPipeline(pipeline: PipelineStage): number {
  const map: Record<PipelineStage, number> = {
    configure: 1,
    'preview-ready': 2,
    submitting: 3,
    'awaiting-approval': 3,
    executing: 4,
    success: 5,
    failed: 5,
  }
  return map[pipeline]
}

export const EXECUTION_STEPS = [
  'Strategy Agent 生成收益策略',
  '校验 Pact allowlist / max spend',
  'Executor Agent 执行 Aave Supply',
  'Revenue Agent 写入收益与分账日志',
] as const

export function isPipelineLocked(pipeline: PipelineStage): boolean {
  return ['submitting', 'awaiting-approval', 'executing', 'success'].includes(pipeline)
}
