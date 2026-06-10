import type { AppState } from '../../shared/types/app'

const DEMO_PACT_PREFIX = 'pact-demo-'
const DEMO_STRATEGY_PREFIX = 'str-demo-'
const PRESET_DEMO_PACT_PREFIX = 'pt-demo-pact-'
const PRESET_DEMO_STRATEGY_PREFIX = 'pt-demo-str-'
const DEMO_LOG_IDS = new Set(['log-1', 'log-2', 'log-3', 'log-4', 'log-5'])
const PRESET_DEMO_LOG_PREFIX = 'pt-demo-log-'

export function stripLegacySeedData(state: AppState): {
  state: AppState
  changed: boolean
  removedPactIds: string[]
} {
  const demoPactIds = state.pacts
    .filter((p) =>
      p.id.startsWith(DEMO_PACT_PREFIX)
      || p.id.startsWith(PRESET_DEMO_PACT_PREFIX),
    )
    .map((p) => p.id)
  const demoPactIdSet = new Set(demoPactIds)
  const hasDemoStrategies = state.strategies.some((s) =>
    s.id.startsWith(DEMO_STRATEGY_PREFIX)
    || s.id.startsWith(PRESET_DEMO_STRATEGY_PREFIX),
  )
  const hasDemoPacts = demoPactIds.length > 0
  const hasDemoLogs = state.logs.some((l) =>
    DEMO_LOG_IDS.has(l.id)
    || l.id.startsWith(PRESET_DEMO_LOG_PREFIX),
  )

  if (!hasDemoStrategies && !hasDemoPacts && !hasDemoLogs) {
    return { state, changed: false, removedPactIds: [] }
  }

  const next: AppState = {
    ...state,
    strategies: state.strategies.filter(
      (s) =>
        !s.id.startsWith(DEMO_STRATEGY_PREFIX)
        && !s.id.startsWith(PRESET_DEMO_STRATEGY_PREFIX)
        && !demoPactIdSet.has(s.pactId),
    ),
    pacts: state.pacts.filter((p) => !demoPactIdSet.has(p.id)),
    logs: state.logs.filter(
      (l) =>
        !DEMO_LOG_IDS.has(l.id)
        && !l.id.startsWith(PRESET_DEMO_LOG_PREFIX)
        && !(l.pactId && demoPactIdSet.has(l.pactId)),
    ),
  }

  if (hasDemoPacts || hasDemoStrategies) {
    next.yieldSeries7d = []
    next.yieldSeries30d = []
  }

  return { state: next, changed: true, removedPactIds: demoPactIds }
}
