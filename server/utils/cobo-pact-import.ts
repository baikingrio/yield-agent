import type { InlinePolicyCreate, PactListResponse, PactPublicRead, PactSummary } from '@cobo/agentic-wallet'
import type { AppState, NetworkId, Pact, Strategy } from '../../shared/types/app'
import {
  applyCoboPactStatusToState,
  mapCoboPactStatus,
  resolveCoboPactSubmissionMessage,
} from './cobo-pact'
import { CoboNotConfiguredError, createCoboPactsApi, isCoboConfigured, withCoboRetry } from './cobo-client'
import { cachePactCredentialFromCobo } from './pact-credentials'
import { getPresetDemoWalletConfig } from './pacttrader-demo-wallet'

export function normalizeCoboPactList(result: PactListResponse | PactSummary[] | undefined): PactSummary[] {
  if (!result) return []
  if (Array.isArray(result)) return result
  return result.pacts ?? []
}

export function resolveAgentWalletIdForSync(state: AppState): string | null {
  const fromPrep = state.walletPreparation.agentWallet.coboWalletId?.trim()
  if (fromPrep) return fromPrep
  const demo = getPresetDemoWalletConfig()
  return demo.enabled ? demo.coboWalletId : null
}

function inferRiskLevel(name: string, intent: string): string {
  const text = `${name} ${intent}`.toLowerCase()
  if (text.includes('保守') || text.includes('conservative')) return 'conservative'
  if (text.includes('激进') || text.includes('aggressive')) return 'aggressive'
  if (text.includes('平衡') || text.includes('balanced')) return 'balanced'
  return 'balanced'
}

function extractMaxSpendUsdc(policies?: InlinePolicyCreate[]): number {
  for (const policy of policies ?? []) {
    const denyIf = policy.rules?.deny_if as { amount_gt?: string } | undefined
    const parsed = Number(denyIf?.amount_gt)
    if (Number.isFinite(parsed) && parsed > 0) return parsed
  }
  return 0
}

function estimateDurationDays(createdAt?: string, expiresAt?: string): number {
  if (!createdAt || !expiresAt) return 7
  const start = Date.parse(createdAt)
  const end = Date.parse(expiresAt)
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return 7
  return Math.max(1, Math.round((end - start) / (24 * 60 * 60 * 1000)))
}

function whitelistFromRecipes(recipeSlugs?: string[]): string[] {
  if (!recipeSlugs?.length) return ['Aave 存入', 'Compound 存入']
  return recipeSlugs
}

function findLocalPact(state: AppState, coboPactId: string): Pact | undefined {
  return state.pacts.find((pact) => pact.coboPactId === coboPactId || pact.id === coboPactId)
}

function strategyStatusForPact(status: Pact['status']): Strategy['status'] {
  if (status === 'completed') return 'completed'
  if (status === 'terminated') return 'paused'
  return 'active'
}

export function importCoboPactIntoState(
  state: AppState,
  remote: PactPublicRead,
  summary?: PactSummary,
): { strategy: Strategy; pact: Pact } {
  const coboPactId = remote.id
  const localStatus = mapCoboPactStatus(remote.status)
  const network = state.settings.network as NetworkId
  const policyCap = extractMaxSpendUsdc(remote.spec?.policies)
  const spent = Number(remote.progress_usd_spent ?? 0)
  const remaining = Number(summary?.remaining?.usd_remaining ?? 0)
  const inferredBudget = Number.isFinite(spent + remaining) ? spent + remaining : 0
  const maxSpend = policyCap || inferredBudget
  const strategyId = `str-cobo-${coboPactId}`
  const riskLevel = inferRiskLevel(remote.name, remote.intent)
  const asset = remote.intent.toUpperCase().includes('USDC') ? 'USDC' : 'USDC'

  const strategy: Strategy = {
    id: strategyId,
    name: remote.name || remote.intent,
    network,
    asset,
    riskLevel,
    maxSpend,
    status: strategyStatusForPact(localStatus),
    pactId: coboPactId,
    createdAt: summary?.created_at ?? remote.activated_at ?? new Date().toISOString(),
  }

  const pact: Pact = {
    id: coboPactId,
    strategyId,
    intent: remote.intent,
    status: localStatus,
    maxSpend,
    whitelist: whitelistFromRecipes(summary?.recipe_slugs),
    durationDays: estimateDurationDays(summary?.created_at, summary?.expires_at ?? remote.expires_at),
    agentFeePercent: state.settings.defaultAgentFee,
    userSplitPercent: state.settings.userSplit,
    submissionMode: 'cobo',
    coboPactId,
    approvalId: remote.approval_id,
    coboStatus: String(remote.status ?? '').toUpperCase(),
    submissionMessage: resolveCoboPactSubmissionMessage(remote.status),
    executionCredentialStored: localStatus === 'active' && Boolean(remote.api_key),
    firstExecutionCompleted: (remote.progress_tx_count ?? 0) > 0,
    firstExecutionAt: remote.activated_at,
  }

  state.strategies.push(strategy)
  state.pacts.push(pact)

  if (localStatus === 'active' && remote.api_key) {
    cachePactCredentialFromCobo(state, pact.id, coboPactId, remote.api_key)
  }

  return { strategy, pact }
}

export async function syncCoboPactsForAgentWallet(state: AppState): Promise<{
  imported: number
  updated: number
  remoteCount: number
}> {
  if (!isCoboConfigured(state)) {
    throw new CoboNotConfiguredError()
  }

  const walletId = resolveAgentWalletIdForSync(state)
  if (!walletId) {
    return { imported: 0, updated: 0, remoteCount: 0 }
  }

  const pactsApi = createCoboPactsApi(state)
  const resp = await withCoboRetry(() => pactsApi.listPacts(
    undefined,
    walletId,
    undefined,
    undefined,
    0,
    50,
    false,
  ))
  const remotePacts = normalizeCoboPactList(resp.data.result).filter((item) => !item.is_default)

  let imported = 0
  let updated = 0

  for (const summary of remotePacts) {
    const existing = findLocalPact(state, summary.id)
    if (existing) {
      applyCoboPactStatusToState(state, existing.id, summary.status)
      updated += 1
      continue
    }

    const detail = await withCoboRetry(() => pactsApi.getPact(summary.id))
    const remote = detail.data.result
    if (!remote) continue
    importCoboPactIntoState(state, remote, summary)
    imported += 1
  }

  return { imported, updated, remoteCount: remotePacts.length }
}
