import type { Pact } from '../../shared/types/demo'

export type PactFilterTab =
  | 'active'
  | 'awaiting-approval'
  | 'completed'
  | 'rejected'
  | 'expired'
  | 'all'

const FILTER_TABS: PactFilterTab[] = [
  'active',
  'awaiting-approval',
  'completed',
  'rejected',
  'expired',
  'all',
]

export function isPactFilterTab(value: unknown): value is PactFilterTab {
  return typeof value === 'string' && FILTER_TABS.includes(value as PactFilterTab)
}

export function normalizeCoboStatus(pact: Pact): string {
  return String(pact.coboStatus ?? '').toUpperCase()
}

export function pactMatchesFilter(pact: Pact, tab: PactFilterTab): boolean {
  switch (tab) {
    case 'active':
      return pact.status === 'active'
    case 'awaiting-approval':
      return pact.status === 'awaiting-approval' || pact.status === 'pending'
    case 'completed':
      return pact.status === 'completed'
    case 'rejected':
      return normalizeCoboStatus(pact) === 'REJECTED'
    case 'expired':
      return normalizeCoboStatus(pact) === 'EXPIRED'
    default:
      return true
  }
}

/** Server list API only supports single PactStatus; other tabs fetch all and filter client-side. */
export function pactListFetchStatus(tab: PactFilterTab): string | undefined {
  if (tab === 'active') return 'active'
  if (tab === 'completed') return 'completed'
  return undefined
}

export function pactDisplayStatusLabel(pact: Pact): string {
  const cobo = normalizeCoboStatus(pact)
  if (cobo === 'REJECTED') return '已拒绝'
  if (cobo === 'EXPIRED') return '已过期'
  const labels: Record<Pact['status'], string> = {
    pending: '待处理',
    active: '执行中',
    completed: '已完成',
    terminated: '已终止',
    'awaiting-approval': '待审批',
  }
  return labels[pact.status]
}

export function pactDisplayStatusTone(
  pact: Pact,
): 'active' | 'pending' | 'paused' | 'error' | 'neutral' {
  const cobo = normalizeCoboStatus(pact)
  if (cobo === 'REJECTED' || cobo === 'EXPIRED') return 'error'
  const tones: Record<Pact['status'], 'active' | 'pending' | 'paused' | 'error' | 'neutral'> = {
    pending: 'pending',
    active: 'active',
    completed: 'neutral',
    terminated: 'error',
    'awaiting-approval': 'paused',
  }
  return tones[pact.status]
}
