import { d as defineEventHandler, a as getRouterParam, c as createError } from '../../../../nitro/nitro.mjs';
import { p as persistCurrentState, g as getState } from '../../../../_/app-store.mjs';
import { r as refreshCoboPactStatus } from '../../../../_/cobo-pact.mjs';
import { f as findPactById } from '../../../../_/pact-lookup.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:module';
import '../../../../_/cobo-client.mjs';
import '@cobo/agentic-wallet';
import '../../../../_/cobo-config.mjs';
import '../../../../_/caw-wallet-bootstrap.mjs';
import 'node:child_process';
import 'node:fs/promises';
import 'node:util';
import '../../../../_/caw-onboard.mjs';
import '../../../../_/caw-provision.mjs';
import '../../../../_/pact-credentials.mjs';

const approve_post = defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({ statusCode: 400, data: { error: "\u7F3A\u5C11 Pact ID" } });
  }
  const state = getState();
  const pact = findPactById(state, id);
  if (!pact) {
    throw createError({ statusCode: 404, data: { error: "Pact not found" } });
  }
  if (pact.status === "terminated") {
    throw createError({ statusCode: 400, data: { error: "\u5DF2\u7EC8\u6B62\u7684 Pact \u65E0\u6CD5\u5BA1\u6279" } });
  }
  if (pact.submissionMode === "cobo") {
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
  pact.status = "active";
  persistCurrentState();
  return pact;
});

export { approve_post as default };
//# sourceMappingURL=approve.post.mjs.map
