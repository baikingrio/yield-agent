import { describe, expect, it } from 'vitest'
import {
  appendYieldSnapshotPoint,
  computeYieldAccrualDelta,
} from '../server/utils/yield-snapshot'

describe('yield snapshot helpers', () => {
  it('establishes baseline without accrual on first read', () => {
    expect(computeYieldAccrualDelta(null, 500)).toEqual({
      deltaUsdc: 0,
      nextLastSuppliedUsdc: 500,
    })
  })

  it('computes positive delta when supplied balance grows', () => {
    const result = computeYieldAccrualDelta(500, 500.01)
    expect(result.deltaUsdc).toBeCloseTo(0.01, 6)
    expect(result.nextLastSuppliedUsdc).toBe(500.01)
  })

  it('resets baseline after redeem without negative yield', () => {
    expect(computeYieldAccrualDelta(500.01, 0)).toEqual({
      deltaUsdc: 0,
      nextLastSuppliedUsdc: 0,
    })
  })

  it('upserts same-day point and prunes older than keepDays', () => {
    const now = new Date('2026-06-08T12:00:00.000Z')
    const points = appendYieldSnapshotPoint(
      [
        { date: '2026-05-30', cumulativeUsdc: 0.001 },
        { date: '2026-06-07', cumulativeUsdc: 0.002 },
      ],
      '2026-06-08',
      0.003,
      7,
      now,
    )
    expect(points.map((p) => p.date)).toEqual(['2026-06-07', '2026-06-08'])
    expect(points.at(-1)?.cumulativeUsdc).toBe(0.003)
  })

  it('replaces existing point for the same date', () => {
    const now = new Date('2026-06-08T12:00:00.000Z')
    const points = appendYieldSnapshotPoint(
      [{ date: '2026-06-08', cumulativeUsdc: 0.001 }],
      '2026-06-08',
      0.004,
      7,
      now,
    )
    expect(points).toHaveLength(1)
    expect(points[0]?.cumulativeUsdc).toBe(0.004)
  })
})
