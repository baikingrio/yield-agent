import { PactsApi } from '@cobo/agentic-wallet'
import type {
  CompletionCondition,
  InlinePolicyCreate,
  PactStatus as CoboPactStatus,
  PactSubmitRequest,
  PactSpecInput,
} from '@cobo/agentic-wallet'
import type { CreateStrategyPayload, DemoState, NetworkId, PactStatus } from '../../shared/types/demo'
import { createCoboPactsApi, extractCoboErrorMessage, isCoboConfigured } from './cobo-client'
import { getNetworkChainConfig } from './cobo-config'

const NETWORK_NAMES: Record<NetworkId, string> = {
  'base-sepolia': 'Base Sepolia 测试网',
  'arbitrum-sepolia': 'Arbitrum Sepolia 测试网',
}

const RISK_NAMES: Record<string, string> = {
  conservative: '保守型收益',
  balanced: '平衡型收益',
  aggressive: '激进型收益',
}

export interface PactSubmitDraft {
  name: string
  intent: string
  originalIntent: string
  spec: PactSpecInput
  recipeSlugs: string[]
}

export interface CoboPactSubmitResult {
  mode: 'cobo' | 'local-draft'
  pactId: string
  status: PactStatus
  approvalId?: string
  message: string
  coboStatus?: string
}

function strategyWhitelist(riskLevel: string): string[] {
  return riskLevel === 'aggressive'
    ? ['Aave 存入', 'Compound 存入', 'Uniswap 兑换']
    : ['Aave 存入', 'Compound 存入']
}

function recipeSlugs(riskLevel: string): string[] {
  return riskLevel === 'aggressive'
    ? ['aave-supply', 'compound-supply', 'uniswap-swap']
    : ['aave-supply', 'compound-supply']
}

export function mapCoboPactStatus(status?: CoboPactStatus | string): PactStatus {
  switch (String(status ?? '').toUpperCase()) {
    case 'ACTIVE':
      return 'active'
    case 'COMPLETED':
      return 'completed'
    case 'TERMINATED':
    case 'REVOKED':
    case 'WITHDRAWN':
    case 'REJECTED':
    case 'EXPIRED':
      return 'terminated'
    case 'PENDING':
      return 'pending'
    case 'PENDING_APPROVAL':
    default:
      return 'awaiting-approval'
  }
}

function localStatusLabel(status: PactStatus): string {
  switch (status) {
    case 'active':
      return '已激活'
    case 'completed':
      return '已完成'
    case 'terminated':
      return '已终止'
    case 'pending':
      return '待处理'
    case 'awaiting-approval':
    default:
      return '待审批'
  }
}

export function applyCoboPactStatusToState(
  state: DemoState,
  pactId: string,
  coboStatus?: CoboPactStatus | string,
  message?: string,
) {
  const pact = state.pacts.find((item) => item.id === pactId || item.coboPactId === pactId)
  if (!pact) {
    throw new Error('Pact not found')
  }

  const previousStatus = pact.status
  const nextStatus = mapCoboPactStatus(coboStatus)
  pact.status = nextStatus
  pact.coboStatus = coboStatus ? String(coboStatus) : pact.coboStatus
  if (message) pact.submissionMessage = message

  const strategy = state.strategies.find((item) => item.id === pact.strategyId)
  if (strategy) {
    if (nextStatus === 'terminated') {
      strategy.status = 'paused'
    } else if (nextStatus === 'completed') {
      strategy.status = 'completed'
    } else if (nextStatus === 'active' || nextStatus === 'awaiting-approval' || nextStatus === 'pending') {
      strategy.status = 'active'
    }
  }

  if (previousStatus !== nextStatus) {
    state.logs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: `Pact 状态已同步：${previousStatus} → ${nextStatus}`,
      type: 'pact',
      txHash: '',
      status: localStatusLabel(nextStatus),
    })
  }

  return pact
}

export interface CoboPactStatusPayload {
  status?: CoboPactStatus | string
  message?: string
}

export type CoboPactStatusFetcher = (pactId: string) => Promise<CoboPactStatusPayload>

export async function syncCoboPactStatus(
  state: DemoState,
  pactId: string,
  fetchStatus: CoboPactStatusFetcher,
) {
  const pact = state.pacts.find((item) => item.id === pactId || item.coboPactId === pactId)
  if (!pact) {
    throw new Error('Pact not found')
  }

  if (pact.submissionMode !== 'cobo') {
    return pact
  }

  const coboPactId = pact.coboPactId || pact.id
  const latest = await fetchStatus(coboPactId)
  return applyCoboPactStatusToState(state, pact.id, latest.status, latest.message)
}

export async function refreshCoboPactStatus(state: DemoState, pactId: string) {
  return syncCoboPactStatus(state, pactId, async (coboPactId) => {
    const pactsApi = createCoboPactsApi(state)
    const resp = await pactsApi.getPact(coboPactId)
    const result = resp.data.result
    return {
      status: result.status,
      message: result.message,
    }
  })
}

function buildPolicies(data: CreateStrategyPayload): InlinePolicyCreate[] {
  const networkConfig = getNetworkChainConfig(data.network)
  const maxSpend = Number(data.maxSpend)
  const allowUniswap = data.riskLevel === 'aggressive'

  const baseWhen = {
    chain_in: [networkConfig.coboChainId],
    token_in: [networkConfig.coboTokenId],
  }

  const policies: InlinePolicyCreate[] = [
    {
      name: 'yieldagent-usdc-transfer-cap',
      type: 'transfer',
      priority: 100,
      is_active: true,
      rules: {
        effect: 'allow',
        when: baseWhen,
        deny_if: {
          amount_gt: String(maxSpend),
          usage_limits: {
            rolling_7d: {
              amount_gt: String(maxSpend),
            },
          },
        },
      },
    },
    {
      name: 'yieldagent-allowlisted-usdc-contract-calls',
      type: 'contract_call',
      priority: 90,
      is_active: true,
      rules: {
        effect: 'allow',
        when: {
          chain_in: [networkConfig.coboChainId],
          target_in: [
            {
              chain_id: networkConfig.coboChainId,
              contract_addr: networkConfig.usdcContract,
            },
          ],
        },
        deny_if: {
          usage_limits: {
            rolling_7d: {
              tx_count_gt: allowUniswap ? 5 : 3,
            },
          },
        },
      },
    },
  ]

  if (!allowUniswap) {
    policies.push({
      name: 'yieldagent-deny-unlisted-contract-calls',
      type: 'contract_call',
      priority: 10,
      is_active: true,
      rules: {
        effect: 'deny',
        when: {
          chain_in: [networkConfig.coboChainId],
        },
      },
    })
  }

  return policies
}

function buildCompletionConditions(): CompletionCondition[] {
  return [
    { type: 'time_elapsed', threshold: String(7 * 24 * 60 * 60) },
    { type: 'tx_count', threshold: '3' },
  ]
}

export function buildYieldPactDraft(data: CreateStrategyPayload): PactSubmitDraft {
  const riskLabel = RISK_NAMES[data.riskLevel] ?? data.riskLevel
  const apyPart = data.targetApy?.trim() ? `，目标 APY ${data.targetApy}%` : ''
  const intent = `${riskLabel} · ${data.asset}（${NETWORK_NAMES[data.network]}）${apyPart}`
  const whitelist = strategyWhitelist(data.riskLevel)
  const maxSpend = Number(data.maxSpend)
  const agentFee = Number(data.agentFee)
  const userSplit = Number(data.userSplit)
  const originalIntent = `用户希望创建 ${intent}：最多使用 ${maxSpend} ${data.asset}，期限 7 天，只允许 ${whitelist.join(' / ')}，收益分账为用户 ${userSplit}%、Agent ${100 - userSplit}%，Agent 绩效费 ${agentFee}%。`

  const executionPlan = [
    '# Summary',
    `Create a bounded YieldAgent strategy for ${maxSpend} ${data.asset} on ${NETWORK_NAMES[data.network]}.`,
    '',
    '# Contract Operations',
    `1. Use only the CAW Agent Wallet funded by the user, never the user's EOA directly.`,
    `2. Execute only allowlisted yield actions: ${whitelist.join(', ')}.`,
    `3. Keep total spend within ${maxSpend} ${data.asset} for this Pact.`,
    '4. Record every allowed execution or denied attempt with status, reason, and transaction hash when available.',
    '',
    '# Risk Controls',
    '- Testnet only; no mainnet funds.',
    '- Reject non-allowlisted protocols, unknown tokens, leverage, LP, derivative, or over-budget actions.',
    `- Revenue split must remain user ${userSplit}% / agent ${100 - userSplit}%.`,
    '',
    '# Schedule',
    '- Pact ends after 7 days or after the configured transaction count threshold is reached.',
  ].join('\n')

  return {
    name: `YieldAgent ${riskLabel}`,
    intent,
    originalIntent,
    recipeSlugs: recipeSlugs(data.riskLevel),
    spec: {
      policies: buildPolicies(data),
      completion_conditions: buildCompletionConditions(),
      execution_plan: executionPlan,
    },
  }
}

export async function submitYieldPactToCobo(
  state: DemoState,
  data: CreateStrategyPayload,
  fallbackPactId: string,
): Promise<CoboPactSubmitResult> {
  const prep = state.walletPreparation
  const draft = buildYieldPactDraft(data)

  if (!prep.agentWallet.coboWalletId || !isCoboConfigured(state)) {
    return {
      mode: 'local-draft',
      pactId: fallbackPactId,
      status: 'awaiting-approval',
      message: 'Cobo API Key 或 Agent Wallet UUID 未配置，已创建本地 Pact draft，未提交到 Cobo。',
    }
  }

  const request: PactSubmitRequest = {
    wallet_id: prep.agentWallet.coboWalletId,
    intent: draft.intent,
    original_intent: draft.originalIntent,
    name: draft.name,
    recipe_slugs: draft.recipeSlugs,
    spec: draft.spec,
  }

  try {
    const pactsApi: PactsApi = createCoboPactsApi(state)
    const resp = await pactsApi.submitPact(request)
    const body = resp.data
    if (body.success === false) {
      throw new Error(body.message || body.suggestion || 'Cobo Pact 提交失败')
    }
    const result = body.result
    return {
      mode: 'cobo',
      pactId: result.pact_id,
      status: mapCoboPactStatus(result.status),
      approvalId: result.approval_id,
      message: result.message || 'Pact 已提交到 Cobo，请在 Cobo Agentic Wallet App 中审批。',
      coboStatus: String(result.status),
    }
  } catch (err) {
    throw new Error(extractCoboErrorMessage(err))
  }
}

export { strategyWhitelist }
