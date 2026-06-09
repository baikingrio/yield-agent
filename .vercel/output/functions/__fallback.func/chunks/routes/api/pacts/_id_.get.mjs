import { d as defineEventHandler, a as getRouterParam, g as getQuery, c as createError } from '../../../nitro/nitro.mjs';
import { p as persistCurrentState, g as getState } from '../../../_/app-store.mjs';
import { r as refreshCoboPactStatus } from '../../../_/cobo-pact.mjs';
import { f as findPactById } from '../../../_/pact-lookup.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:module';
import '../../../_/cobo-client.mjs';
import '@cobo/agentic-wallet';
import '../../../_/cobo-config.mjs';
import '../../../_/caw-wallet-bootstrap.mjs';
import 'node:child_process';
import 'node:fs/promises';
import 'node:util';
import '../../../_/caw-onboard.mjs';
import '../../../_/caw-provision.mjs';
import '../../../_/pact-credentials.mjs';

const _id__get = defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  const query = getQuery(event);
  const state = getState();
  const pact = id ? findPactById(state, id) : void 0;
  if (!pact) {
    throw createError({ statusCode: 404, statusMessage: "Pact not found", data: { error: "Pact not found" } });
  }
  if (query.sync === "true" && pact.submissionMode === "cobo") {
    try {
      const synced = await refreshCoboPactStatus(state, pact.id);
      persistCurrentState();
      return synced;
    } catch (err) {
      throw createError({
        statusCode: 502,
        data: { error: err instanceof Error ? err.message : "Cobo Pact \u72B6\u6001\u540C\u6B65\u5931\u8D25" }
      });
    }
  }
  return pact;
});

export { _id__get as default };
//# sourceMappingURL=_id_.get.mjs.map
