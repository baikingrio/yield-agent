import type { YieldRange } from '../../shared/types/app'
import { getState, persistCurrentState } from '../utils/app-store'
import { syncYieldSnapshotFromChain } from '../utils/yield-snapshot'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const range: YieldRange = query.range === '30d' ? '30d' : '7d'
  const state = getState()

  if (query.sync === 'true' && range === '7d') {
    try {
      await syncYieldSnapshotFromChain(state)
      persistCurrentState()
    } catch {
      // Keep chart API usable when RPC is temporarily unavailable.
    }
  }

  const points = range === '30d' ? state.yieldSeries30d : state.yieldSeries7d

  return {
    range,
    points,
    totalUsdc: points.at(-1)?.cumulativeUsdc ?? 0,
  }
})
