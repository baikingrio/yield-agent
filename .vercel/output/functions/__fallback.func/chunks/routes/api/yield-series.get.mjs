import { d as defineEventHandler, g as getQuery } from '../../nitro/nitro.mjs';
import { p as persistCurrentState, g as getState } from '../../_/app-store.mjs';
import { s as syncYieldSnapshotFromChain } from '../../_/yield-snapshot.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:module';
import '../../_/cobo-config.mjs';
import '../../_/yield-position.mjs';
import 'viem';
import 'viem/chains';

const yieldSeries_get = defineEventHandler(async (event) => {
  var _a, _b;
  const query = getQuery(event);
  const range = query.range === "30d" ? "30d" : "7d";
  const state = getState();
  if (query.sync === "true" && range === "7d") {
    try {
      await syncYieldSnapshotFromChain(state);
      persistCurrentState();
    } catch {
    }
  }
  const points = range === "30d" ? state.yieldSeries30d : state.yieldSeries7d;
  return {
    range,
    points,
    totalUsdc: (_b = (_a = points.at(-1)) == null ? void 0 : _a.cumulativeUsdc) != null ? _b : 0
  };
});

export { yieldSeries_get as default };
//# sourceMappingURL=yield-series.get.mjs.map
