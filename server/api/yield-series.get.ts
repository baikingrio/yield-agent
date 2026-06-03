import type { YieldRange } from '../../shared/types/demo'
import { getState } from '../utils/demo-store'

export default defineEventHandler((event) => {
  const query = getQuery(event)
  const range: YieldRange = query.range === '30d' ? '30d' : '7d'
  const state = getState()
  const points = range === '30d' ? state.yieldSeries30d : state.yieldSeries7d

  return {
    range,
    points,
    totalUsdc: points.at(-1)?.cumulativeUsdc ?? 0,
  }
})
