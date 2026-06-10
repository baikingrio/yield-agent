import type { Pact, Strategy } from '#shared/types/app'

export interface ActivePactView {
  pact: Pact
  strategy: Strategy | null
}

export function pickActivePact(pacts: Pact[], strategies: Strategy[]): ActivePactView | null {
  const active = pacts.find((p) => p.status === 'active')
    ?? pacts.find((p) => p.status === 'awaiting-approval')
    ?? pacts.find((p) => p.status === 'pending')
  if (!active) return null
  const strategy = strategies.find((s) => s.pactId === active.id || s.id === active.strategyId) ?? null
  return { pact: active, strategy }
}

export function pickDenialDemoPact(pacts: Pact[]): Pact | null {
  return pacts.find((p) => p.status === 'active')
    ?? pacts.find((p) => p.status === 'pending' || p.status === 'awaiting-approval')
    ?? null
}
