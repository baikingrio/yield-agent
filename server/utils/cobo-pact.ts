import { PactsApi } from '@cobo/agentic-wallet'
import type {
  CompletionCondition,
  InlinePolicyCreate,
  PactStatus as CoboPactStatus,
  PactSubmitRequest,
  PactSpecInput,
} from '@cobo/agentic-wallet'
import type { CreateStrategyPayload, AppState, NetworkId, Pact, PactStatus } from '../../shared/types/app'
import { createCoboPactsApi, extractCoboErrorMessage, isCoboConfigured, isInvalidApiKeyError } from './cobo-client'
import { refreshApiKeyFromCli } from './cobo-api-key'
import { buildYieldContractCallTargets, getNetworkChainConfig } from './cobo-config'
import { isLocalDraftAllowed } from './local-draft-policy'
import { revokeStoredPactCredential } from './pact-credentials'

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

function strategyWhitelist(riskLevel: string, network: NetworkId): string[] {
  const protocols = riskLevel === 'aggressive'
    ? ['Aave 存入', 'Compound 存入', 'Uniswap 兑换']
    : ['Aave 存入', 'Compound 存入']
  if (!getNetworkChainConfig(network).yieldProtocols.compoundComet) {
    return protocols.filter((item) => item !== 'Compound 存入')
  }
  return protocols
}

/** Only include slugs validated against Cobo; placeholder names are not sent by default. */
export function resolvePactRecipeSlugs(_riskLevel: string): string[] {
  const fromEnv = process.env.CAW_PACT_RECIPE_SLUGS?.split(',')
    .map((slug) => slug.trim())
    .filter(Boolean)
  return fromEnv?.length ? fromEnv : []
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

export function resolveCoboPactSubmissionMessage(
  coboStatus?: CoboPactStatus | string,
  remoteMessage?: string,
): string | undefined {
  const normalized = String(coboStatus ?? '').toUpperCase()
  const trimmed = remoteMessage?.trim()

  switch (normalized) {
    case 'REVOKED':
      return '钱包主人已在 Cobo App 撤销此 Pact，Agent 无法再执行。'
    case 'WITHDRAWN':
      return 'Agent 已撤回此 Pact 提交。'
    case 'REJECTED':
      return '钱包主人已在 Cobo App 拒绝此 Pact。'
    case 'EXPIRED':
      return 'Pact 已过期。'
    case 'COMPLETED':
      return 'Pact 已完成。'
    case 'ACTIVE':
      return trimmed || 'Pact 已生效，可执行 Recipe。'
    case 'PENDING_APPROVAL':
      return trimmed || 'Pact 已提交，请在 Cobo Agentic Wallet App 中审批。'
    default:
      return trimmed
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
  state: AppState,
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
  pact.submissionMessage = resolveCoboPactSubmissionMessage(coboStatus, message)
    ?? pact.submissionMessage

  if (nextStatus === 'terminated' || nextStatus === 'completed') {
    revokeStoredPactCredential(pact.id)
    pact.executionCredentialStored = false
  }

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
      pactId: pact.id,
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
  state: AppState,
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

export async function refreshCoboPactStatus(state: AppState, pactId: string) {
  const localPact = state.pacts.find((item) => item.id === pactId || item.coboPactId === pactId)
  const localPactId = localPact?.id ?? pactId

  const pact = await syncCoboPactStatus(state, pactId, async (coboPactId) => {
    const pactsApi = createCoboPactsApi(state)
    const resp = await pactsApi.getPact(coboPactId)
    const result = resp.data.result
    if (mapCoboPactStatus(result.status) === 'active' && result.api_key) {
      const { cachePactCredentialFromCobo } = await import('./pact-credentials')
      cachePactCredentialFromCobo(state, localPactId, coboPactId, result.api_key)
    }
    return {
      status: result.status,
      message: result.message,
    }
  })
  return pact
}

function chainTokenRef(networkConfig: ReturnType<typeof getNetworkChainConfig>) {
  return {
    chain_id: networkConfig.coboChainId,
    token_id: networkConfig.coboTokenId,
  }
}

export function buildYieldPactPolicies(data: CreateStrategyPayload): InlinePolicyCreate[] {
  const networkConfig = getNetworkChainConfig(data.network)
  const maxSpend = Number(data.maxSpend)
  const allowUniswap = data.riskLevel === 'aggressive'
  const contractCallTxCap = allowUniswap ? 12 : 8

  // Pact inline policies only support effect='allow'; use deny_if for caps and rely on
  // allowlist semantics for everything outside target_in / token_in.
  return [
    {
      name: 'yieldagent-usdc-transfer-cap',
      type: 'transfer',
      priority: 100,
      is_active: true,
      rules: {
        effect: 'allow',
        when: {
          chain_in: [networkConfig.coboChainId],
          token_in: [chainTokenRef(networkConfig)],
        },
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
      name: 'yieldagent-allowlisted-yield-contract-calls',
      type: 'contract_call',
      priority: 90,
      is_active: true,
      rules: {
        effect: 'allow',
        when: {
          chain_in: [networkConfig.coboChainId],
          target_in: buildYieldContractCallTargets(data.network, data.riskLevel),
        },
        deny_if: {
          usage_limits: {
            rolling_7d: {
              tx_count_gt: contractCallTxCap,
            },
          },
        },
      },
    },
  ]
}

function buildCompletionConditions(): CompletionCondition[] {
  // 仅按时间结束。tx_count 会把失败的预检/重试计入，容易在未成功存入前提前 completed。
  return [
    { type: 'time_elapsed', threshold: String(7 * 24 * 60 * 60) },
  ]
}

export function buildYieldPactDraft(data: CreateStrategyPayload): PactSubmitDraft {
  const riskLabel = RISK_NAMES[data.riskLevel] ?? data.riskLevel
  const apyPart = data.targetApy?.trim() ? `，目标 APY ${data.targetApy}%` : ''
  const intent = `${riskLabel} · ${data.asset}（${NETWORK_NAMES[data.network]}）${apyPart}`
  const whitelist = strategyWhitelist(data.riskLevel, data.network)
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
    recipeSlugs: resolvePactRecipeSlugs(data.riskLevel),
    spec: {
      policies: buildYieldPactPolicies(data),
      completion_conditions: buildCompletionConditions(),
      execution_plan: executionPlan,
    },
  }
}

export async function submitYieldPactToCobo(
  state: AppState,
  data: CreateStrategyPayload,
  fallbackPactId: string,
): Promise<CoboPactSubmitResult> {
  const prep = state.walletPreparation
  const draft = buildYieldPactDraft(data)

  const allowLocalDraft = isLocalDraftAllowed(state)

  if (!prep.agentWallet.coboWalletId || !isCoboConfigured(state)) {
    if (!allowLocalDraft) {
      throw new Error(
        'Cobo API 未配置。请在设置页填写 Cobo API Key，或配置 AGENT_WALLET_API_KEY。开发者可在设置页开启开发者模式。',
      )
    }
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
    spec: draft.spec,
    ...(draft.recipeSlugs.length ? { recipe_slugs: draft.recipeSlugs } : {}),
  }

  const submitOnce = async () => {
    const pactsApi: PactsApi = createCoboPactsApi(state)
    const resp = await pactsApi.submitPact(request)
    const body = resp.data
    if (body.success === false) {
      throw new Error(body.message || body.suggestion || 'Cobo Pact 提交失败')
    }
    const result = body.result
    return {
      mode: 'cobo' as const,
      pactId: result.pact_id,
      status: mapCoboPactStatus(result.status),
      approvalId: result.approval_id,
      message: result.message || 'Pact 已提交到 Cobo，请在 Cobo Agentic Wallet App 中审批。',
      coboStatus: String(result.status),
    }
  }

  try {
    return await submitOnce()
  } catch (err) {
    if (isInvalidApiKeyError(err)) {
      const refreshed = await refreshApiKeyFromCli(state, { force: true })
      if (refreshed) {
        try {
          return await submitOnce()
        } catch (retryErr) {
          const message = extractCoboErrorMessage(retryErr)
          if (!allowLocalDraft) throw new Error(message)
          return {
            mode: 'local-draft',
            pactId: fallbackPactId,
            status: 'awaiting-approval',
            message: `Cobo Pact 提交暂不可用，已保留为本地 Pact draft：${message}`,
          }
        }
      }
    }

    const message = extractCoboErrorMessage(err)
    if (!allowLocalDraft) throw new Error(message)
    return {
      mode: 'local-draft',
      pactId: fallbackPactId,
      status: 'awaiting-approval',
      message: `Cobo Pact 提交暂不可用，已保留为本地 Pact draft：${message}`,
    }
  }
}

export const COBO_OWNER_REVOKE_MESSAGE =
  '生效中的 Cobo Pact 只能由钱包主人在 Cobo Agentic Wallet App 内撤销（Agent API Key 无 revoke 权限）。若已执行存入，请先在网页点击「赎回至 Agent Wallet」，再在 App 撤销；撤销后资金不会自动从 Compound/Aave 返回。'

export type CoboTerminateAction =
  | { type: 'withdraw' }
  | { type: 'owner_revoke_required' }
  | { type: 'local_only' }

export function resolveCoboTerminateAction(pact: Pact): CoboTerminateAction {
  if (pact.submissionMode !== 'cobo' || !pact.coboPactId) return { type: 'local_only' }
  if (pact.status === 'awaiting-approval' || pact.status === 'pending') return { type: 'withdraw' }
  if (pact.status === 'active') return { type: 'owner_revoke_required' }
  return { type: 'local_only' }
}

export { strategyWhitelist }
