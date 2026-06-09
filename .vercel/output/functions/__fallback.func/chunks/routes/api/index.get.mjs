import { d as defineEventHandler, g as getQuery } from '../../nitro/nitro.mjs';
import { g as getState } from '../../_/app-store.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:module';

const LOG_TYPES = ["swap", "supply", "revenue", "pact"];
const index_get = defineEventHandler((event) => {
  const query = getQuery(event);
  const type = typeof query.type === "string" ? query.type : void 0;
  const pactId = typeof query.pactId === "string" ? query.pactId.trim() : void 0;
  const limitRaw = typeof query.limit === "string" ? Number(query.limit) : 50;
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 200) : 50;
  let logs = [...getState().logs].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  if (type && LOG_TYPES.includes(type)) {
    logs = logs.filter((l) => l.type === type);
  }
  if (pactId) {
    logs = logs.filter((l) => l.pactId === pactId);
  }
  return logs.slice(0, limit);
});

export { index_get as default };
//# sourceMappingURL=index.get.mjs.map
