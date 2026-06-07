import type { DemoState } from '../../shared/types/demo'

const DEMO_PACT_PREFIX = 'pact-demo-'
const DEMO_STRATEGY_PREFIX = 'str-demo-'
const DEMO_LOG_IDS = new Set(['log-1', 'log-2', 'log-3', 'log-4', 'log-5'])

export function stripDemoSeedData(state: DemoState): {
  state: DemoState
  changed: boolean
  removedPactIds: string[]
} {
  const demoPactIds = state.pacts
    .filter((p) => p.id.startsWith(DEMO_PACT_PREFIX))
    .map((p) => p.id)
  const demoPactIdSet = new Set(demoPactIds)
  const hasDemoStrategies = state.strategies.some((s) => s.id.startsWith(DEMO_STRATEGY_PREFIX))
  const hasDemoPacts = demoPactIds.length > 0
  const hasDemoLogs = state.logs.some((l) => DEMO_LOG_IDS.has(l.id))

  if (!hasDemoStrategies && !hasDemoPacts && !hasDemoLogs) {
    return { state, changed: false, removedPactIds: [] }
  }

  const next: DemoState = {
    ...state,
    strategies: state.strategies.filter(
      (s) => !s.id.startsWith(DEMO_STRATEGY_PREFIX) && !demoPactIdSet.has(s.pactId),
    ),
    pacts: state.pacts.filter((p) => !demoPactIdSet.has(p.id)),
    logs: state.logs.filter(
      (l) => !DEMO_LOG_IDS.has(l.id) && !(l.pactId && demoPactIdSet.has(l.pactId)),
    ),
  }

  if (hasDemoPacts || hasDemoStrategies) {
    next.yieldSeries7d = []
    next.yieldSeries30d = []
  }

  return { state: next, changed: true, removedPactIds: demoPactIds }
}
