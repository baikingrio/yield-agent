import type { AppState, YieldPoint } from '../../shared/types/app'
import { getNetworkChainConfig } from './cobo-config'
import { readYieldSuppliedAmount } from './yield-position'

export function computeYieldAccrualDelta(
  lastSuppliedUsdc: number | null | undefined,
  currentSuppliedUsdc: number,
): { deltaUsdc: number; nextLastSuppliedUsdc: number } {
  if (lastSuppliedUsdc == null) {
    return { deltaUsdc: 0, nextLastSuppliedUsdc: currentSuppliedUsdc }
  }
  if (currentSuppliedUsdc < lastSuppliedUsdc) {
    return { deltaUsdc: 0, nextLastSuppliedUsdc: currentSuppliedUsdc }
  }
  return {
    deltaUsdc: currentSuppliedUsdc - lastSuppliedUsdc,
    nextLastSuppliedUsdc: currentSuppliedUsdc,
  }
}

export function appendYieldSnapshotPoint(
  points: YieldPoint[],
  date: string,
  cumulativeUsdc: number,
  keepDays: number,
  now: Date = new Date(),
): YieldPoint[] {
  const merged = [
    ...points.filter((p) => p.date !== date),
    { date, cumulativeUsdc },
  ].sort((a, b) => a.date.localeCompare(b.date))

  const cutoff = new Date(now)
  cutoff.setUTCDate(cutoff.getUTCDate() - keepDays)
  const cutoffStr = cutoff.toISOString().slice(0, 10)
  return merged.filter((p) => p.date >= cutoffStr)
}

/** Read Compound/Aave supplied balance and append accrued yield to yieldSeries7d. */
export async function syncYieldSnapshotFromChain(state: AppState): Promise<boolean> {
  const address = state.walletPreparation.agentWallet.address
  if (!address) return false

  const network = state.walletPreparation.network
  const chainConfig = getNetworkChainConfig(network)
  const raw = await readYieldSuppliedAmount(
    network,
    chainConfig,
    address as `0x${string}`,
  )
  const currentSuppliedUsdc = Number(raw) / 10 ** chainConfig.usdcDecimals

  const { deltaUsdc, nextLastSuppliedUsdc } = computeYieldAccrualDelta(
    state.yieldSnapshotLastSuppliedUsdc,
    currentSuppliedUsdc,
  )
  state.yieldSnapshotLastSuppliedUsdc = nextLastSuppliedUsdc

  if (deltaUsdc <= 0) {
    return state.yieldSnapshotLastSuppliedUsdc != null
  }

  const prevCumulative = state.yieldSeries7d.at(-1)?.cumulativeUsdc
    ?? state.wallet.cumulativeYieldUsdc
    ?? 0
  const cumulativeUsdc = Math.round((prevCumulative + deltaUsdc) * 1_000_000) / 1_000_000
  const today = new Date().toISOString().slice(0, 10)

  state.yieldSeries7d = appendYieldSnapshotPoint(state.yieldSeries7d, today, cumulativeUsdc, 7)
  state.wallet.cumulativeYieldUsdc = cumulativeUsdc
  return true
}
