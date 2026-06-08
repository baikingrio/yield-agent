import type {
  CreateStrategyPayload,
  AppState,
  NetworkId,
  StrategyProposal,
} from '../../shared/types/app'
import { MAX_MAX_SPEND_USDC, MIN_MAX_SPEND_USDC } from '../../shared/types/app'
import { normalizeNumericField, parseNumericField } from '../../shared/utils/numeric-field'

export interface StrategyValidationResult {
  valid: boolean
  errors: Partial<Record<keyof CreateStrategyPayload, string>>
}

export interface StrategyValidationOptions {
  /** 自然语言解析等场景：用请求传入的可用余额，而非仅读 state */
  availableUsdc?: number
}

export function validateStrategyPayload(
  state: AppState,
  data: CreateStrategyPayload,
  options?: StrategyValidationOptions,
): StrategyValidationResult {
  const errors: Partial<Record<keyof CreateStrategyPayload, string>> = {}
  const spend = parseNumericField(data.maxSpend)
  const fee = parseNumericField(data.agentFee)
  const user = parseNumericField(data.userSplit)
  const spendRangeMessage = `请输入 ${MIN_MAX_SPEND_USDC}–${MAX_MAX_SPEND_USDC.toLocaleString('en-US')} USDC`

  if (state.walletPreparation.ready && data.network !== state.walletPreparation.network) {
    errors.network = `必须与 Agent Wallet 注资网络一致（${state.walletPreparation.network}）`
  }

  if (spend === null || spend < MIN_MAX_SPEND_USDC || spend > MAX_MAX_SPEND_USDC) {
    errors.maxSpend = spendRangeMessage
  } else {
    const available =
      options?.availableUsdc
      ?? (state.walletPreparation.ready ? state.walletPreparation.funding.availableUsdc : undefined)
    if (available !== undefined && spend > available) {
      errors.maxSpend = `不能超过 Agent Wallet 可用余额（${available} USDC）`
    }
  }

  if (fee === null || fee < 0 || fee > 30) {
    errors.agentFee = '请输入 0–30%'
  }

  if (user === null || user < 0 || user > 100) {
    errors.userSplit = '请输入 0–100%'
  }

  if (data.targetApy?.trim()) {
    const apy = parseNumericField(data.targetApy)
    if (apy === null || apy < 0 || apy > 100) {
      errors.targetApy = '请输入 0–100，或留空'
    }
  }

  return { valid: Object.keys(errors).length === 0, errors }
}

export function normalizeStrategyProposal(
  proposal: Partial<StrategyProposal>,
  fallbackNetwork: NetworkId,
): StrategyProposal | null {
  const network = proposal.network === 'arbitrum-sepolia' ? 'arbitrum-sepolia' : 'base-sepolia'
  const asset = proposal.asset?.trim() || 'USDC'
  const riskLevel = ['conservative', 'balanced', 'aggressive'].includes(String(proposal.riskLevel))
    ? String(proposal.riskLevel)
    : 'conservative'

  const maxSpend = proposal.maxSpend?.trim()
  if (!maxSpend) return null

  return {
    network: proposal.network === 'base-sepolia' || proposal.network === 'arbitrum-sepolia'
      ? proposal.network
      : fallbackNetwork,
    asset,
    targetApy: proposal.targetApy?.trim() || undefined,
    riskLevel,
    maxSpend: normalizeNumericField(maxSpend, maxSpend),
    agentFee: normalizeNumericField(proposal.agentFee, '15'),
    userSplit: normalizeNumericField(proposal.userSplit, '85'),
  }
}
