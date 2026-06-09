import { b as getNetworkChainConfig } from './cobo-config.mjs';
import { c as readYieldSuppliedAmount } from './yield-position.mjs';

function computeYieldAccrualDelta(lastSuppliedUsdc, currentSuppliedUsdc) {
  if (lastSuppliedUsdc == null) {
    return { deltaUsdc: 0, nextLastSuppliedUsdc: currentSuppliedUsdc };
  }
  if (currentSuppliedUsdc < lastSuppliedUsdc) {
    return { deltaUsdc: 0, nextLastSuppliedUsdc: currentSuppliedUsdc };
  }
  return {
    deltaUsdc: currentSuppliedUsdc - lastSuppliedUsdc,
    nextLastSuppliedUsdc: currentSuppliedUsdc
  };
}
function appendYieldSnapshotPoint(points, date, cumulativeUsdc, keepDays, now = /* @__PURE__ */ new Date()) {
  const merged = [
    ...points.filter((p) => p.date !== date),
    { date, cumulativeUsdc }
  ].sort((a, b) => a.date.localeCompare(b.date));
  const cutoff = new Date(now);
  cutoff.setUTCDate(cutoff.getUTCDate() - keepDays);
  const cutoffStr = cutoff.toISOString().slice(0, 10);
  return merged.filter((p) => p.date >= cutoffStr);
}
async function syncYieldSnapshotFromChain(state) {
  var _a, _b, _c;
  const address = state.walletPreparation.agentWallet.address;
  if (!address) return false;
  const network = state.walletPreparation.network;
  const chainConfig = getNetworkChainConfig(network);
  const raw = await readYieldSuppliedAmount(
    network,
    chainConfig,
    address
  );
  const currentSuppliedUsdc = Number(raw) / 10 ** chainConfig.usdcDecimals;
  const { deltaUsdc, nextLastSuppliedUsdc } = computeYieldAccrualDelta(
    state.yieldSnapshotLastSuppliedUsdc,
    currentSuppliedUsdc
  );
  state.yieldSnapshotLastSuppliedUsdc = nextLastSuppliedUsdc;
  if (deltaUsdc <= 0) {
    return state.yieldSnapshotLastSuppliedUsdc != null;
  }
  const prevCumulative = (_c = (_b = (_a = state.yieldSeries7d.at(-1)) == null ? void 0 : _a.cumulativeUsdc) != null ? _b : state.wallet.cumulativeYieldUsdc) != null ? _c : 0;
  const cumulativeUsdc = Math.round((prevCumulative + deltaUsdc) * 1e6) / 1e6;
  const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  state.yieldSeries7d = appendYieldSnapshotPoint(state.yieldSeries7d, today, cumulativeUsdc, 7);
  state.wallet.cumulativeYieldUsdc = cumulativeUsdc;
  return true;
}

export { syncYieldSnapshotFromChain as s };
//# sourceMappingURL=yield-snapshot.mjs.map
