import type { CreateStrategyPayload, DemoState, NetworkId, StrategyProposal } from '../../shared/types/demo'

export interface StrategyValidationResult {
  valid: boolean
  errors: Partial<Record<keyof CreateStrategyPayload, string>>
}

export function validateStrategyPayload(
  state: DemoState,
  data: CreateStrategyPayload,
): StrategyValidationResult {
  const errors: Partial<Record<keyof CreateStrategyPayload, string>> = {}
  const spend = Number(data.maxSpend)
  const fee = Number(data.agentFee)
  const user = Number(data.userSplit)

  if (state.walletPreparation.ready && data.network !== state.walletPreparation.network) {
    errors.network = `必须与 Agent Wallet 注资网络一致（${state.walletPreparation.network}）`
  }

  if (!data.maxSpend || Number.isNaN(spend) || spend < 10 || spend > 1_000_000) {
    errors.maxSpend = '请输入 10–1,000,000 USDC'
  } else if (state.walletPreparation.ready) {
    const available = state.walletPreparation.funding.availableUsdc
    if (spend > available) {
      errors.maxSpend = `不能超过 Agent Wallet 可用余额（${available} USDC）`
    }
  }

  if (!data.agentFee || Number.isNaN(fee) || fee < 0 || fee > 30) {
    errors.agentFee = '请输入 0–30%'
  }

  if (!data.userSplit || Number.isNaN(user) || user < 0 || user > 100) {
    errors.userSplit = '请输入 0–100%'
  }

  if (data.targetApy?.trim()) {
    const apy = Number(data.targetApy)
    if (Number.isNaN(apy) || apy < 0 || apy > 100) {
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

  if (!proposal.maxSpend?.trim()) return null

  return {
    network: proposal.network === 'base-sepolia' || proposal.network === 'arbitrum-sepolia'
      ? proposal.network
      : fallbackNetwork,
    asset,
    targetApy: proposal.targetApy?.trim() || undefined,
    riskLevel,
    maxSpend: proposal.maxSpend.trim(),
    agentFee: proposal.agentFee?.trim() || '15',
    userSplit: proposal.userSplit?.trim() || '85',
  }
}
