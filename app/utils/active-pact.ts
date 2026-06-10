import type { Pact, PactStatus, Strategy } from '#shared/types/app'

export interface ActivePactView {
  pact: Pact
  strategy: Strategy | null
}

const LIVE_PACT_STATUSES: PactStatus[] = ['active', 'awaiting-approval', 'pending']

const STATUS_SORT_RANK: Record<PactStatus, number> = {
  active: 0,
  'awaiting-approval': 1,
  pending: 2,
  completed: 3,
  terminated: 4,
}

function strategyForPact(pact: Pact, strategies: Strategy[]): Strategy | null {
  return strategies.find((s) => s.pactId === pact.id || s.id === pact.strategyId) ?? null
}

export function listLivePacts(pacts: Pact[], strategies: Strategy[]): ActivePactView[] {
  return pacts
    .filter((p) => LIVE_PACT_STATUSES.includes(p.status))
    .sort((a, b) => STATUS_SORT_RANK[a.status] - STATUS_SORT_RANK[b.status])
    .map((pact) => ({ pact, strategy: strategyForPact(pact, strategies) }))
}

export function countPactsByStatus(pacts: Pact[], status: PactStatus): number {
  return pacts.filter((p) => p.status === status).length
}

export function formatLivePactSummary(pacts: Pact[]): string {
  const active = countPactsByStatus(pacts, 'active')
  const awaiting = countPactsByStatus(pacts, 'awaiting-approval')
  const pending = countPactsByStatus(pacts, 'pending')

  const parts: string[] = []
  if (active > 0) parts.push(`${active} 个生效中`)
  if (awaiting > 0) parts.push(`${awaiting} 个待 Cobo 审批`)
  if (pending > 0) parts.push(`${pending} 个待审批`)
  return parts.join(' · ') || '无 Live Pact'
}

export function pactStatusLabel(status: PactStatus): string {
  if (status === 'active') return '生效中'
  if (status === 'awaiting-approval') return '待 Cobo App 审批'
  if (status === 'pending') return '待审批'
  if (status === 'completed') return '已完成'
  if (status === 'terminated') return '已终止'
  return status
}

export function pactStatusTone(
  status: PactStatus,
): 'active' | 'pending' | 'paused' | 'neutral' {
  if (status === 'active') return 'active'
  if (status === 'pending' || status === 'awaiting-approval') return 'pending'
  if (status === 'terminated') return 'paused'
  return 'neutral'
}

export function pickActivePact(pacts: Pact[], strategies: Strategy[]): ActivePactView | null {
  return listLivePacts(pacts, strategies)[0] ?? null
}

export function pickDenialDemoPact(pacts: Pact[]): Pact | null {
  return pacts.find((p) => p.status === 'active')
    ?? pacts.find((p) => p.status === 'pending' || p.status === 'awaiting-approval')
    ?? null
}
