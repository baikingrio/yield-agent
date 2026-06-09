import { d as defineEventHandler, a as getRouterParam, c as createError } from '../../../../nitro/nitro.mjs';
import { p as persistCurrentState, g as getState } from '../../../../_/app-store.mjs';
import { e as extractCoboErrorMessage } from '../../../../_/cobo-client.mjs';
import { r as refreshCoboPactStatus } from '../../../../_/cobo-pact.mjs';
import { e as executeFirstPactRecipe } from '../../../../_/cobo-execution.mjs';
import { resolvePactExecutionApiKey } from '../../../../_/pact-credentials.mjs';
import { f as findPactById } from '../../../../_/pact-lookup.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:module';
import '@cobo/agentic-wallet';
import '../../../../_/cobo-config.mjs';
import '../../../../_/caw-wallet-bootstrap.mjs';
import 'node:child_process';
import 'node:fs/promises';
import 'node:util';
import '../../../../_/caw-onboard.mjs';
import '../../../../_/caw-provision.mjs';
import 'viem';
import 'viem/chains';
import '../../../../_/agent-gas.mjs';
import '../../../../_/app.mjs';
import '../../../../_/cobo-preparation.mjs';
import '../../../../_/yield-snapshot.mjs';
import '../../../../_/yield-position.mjs';

function isCoboSubmittedPact(pact) {
  if (pact.submissionMode === "local-draft") return false;
  if (pact.submissionMode === "cobo") return true;
  return Boolean(pact.coboPactId);
}
function pactExecutionBlockedReason(pact) {
  if (pact.submissionMode === "local-draft") {
    return "\u672C\u5730 draft \u6A21\u5F0F\u672A\u63A5 Cobo\uFF0C\u65E0\u6CD5\u6267\u884C Recipe\u3002";
  }
  if (!isCoboSubmittedPact(pact)) {
    return "\u6B64 Pact \u672A\u901A\u8FC7 Cobo \u63D0\u4EA4\uFF0C\u65E0\u6CD5\u6267\u884C Recipe\u3002";
  }
  if (pact.status !== "active") {
    return "Pact \u5C1A\u672A\u6FC0\u6D3B\uFF0C\u65E0\u6CD5\u6267\u884C Recipe\u3002";
  }
  return null;
}

const execute_post = defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({ statusCode: 400, data: { error: "\u7F3A\u5C11 Pact ID" } });
  }
  const state = getState();
  const pact = findPactById(state, id);
  if (!pact) {
    throw createError({ statusCode: 404, data: { error: "Pact not found" } });
  }
  const blocked = pactExecutionBlockedReason(pact);
  if (blocked) {
    throw createError({ statusCode: 400, data: { error: blocked } });
  }
  if (!isCoboSubmittedPact(pact)) {
    throw createError({
      statusCode: 400,
      data: { error: "\u6B64 Pact \u672A\u901A\u8FC7 Cobo \u63D0\u4EA4\uFF0C\u65E0\u6CD5\u6267\u884C Recipe\u3002" }
    });
  }
  try {
    await refreshCoboPactStatus(state, pact.id);
    persistCurrentState();
  } catch (err) {
    throw createError({
      statusCode: 502,
      data: { error: extractCoboErrorMessage(err) }
    });
  }
  const blockedAfterSync = pactExecutionBlockedReason(pact);
  if (blockedAfterSync) {
    throw createError({ statusCode: 400, data: { error: blockedAfterSync } });
  }
  if (!resolvePactExecutionApiKey(state, pact.id)) {
    throw createError({
      statusCode: 502,
      data: {
        error: pact.status === "completed" ? "Pact \u5DF2\u5728 Cobo \u4FA7\u5B8C\u6210\uFF0C\u65E0\u6CD5\u7EE7\u7EED\u6267\u884C\u3002\u8BF7\u91CD\u65B0\u521B\u5EFA\u7B56\u7565\u4E0E Pact\u3002" : "\u672A\u627E\u5230 pact-scoped \u6267\u884C\u51ED\u8BC1\u3002\u8BF7\u5728 Cobo App \u5B8C\u6210\u5BA1\u6279\u540E\uFF0C\u4E8E Pact \u7BA1\u7406\u9875\u70B9\u51FB\u300C\u6211\u5DF2\u6279\u51C6\uFF0C\u5237\u65B0\u72B6\u6001\u300D\u518D\u8BD5\u3002"
      }
    });
  }
  try {
    const result = await executeFirstPactRecipe(state, pact.id);
    persistCurrentState();
    return result;
  } catch (err) {
    throw createError({
      statusCode: 502,
      data: { error: err instanceof Error ? err.message : "Recipe \u6267\u884C\u5931\u8D25" }
    });
  }
});

export { execute_post as default };
//# sourceMappingURL=execute.post.mjs.map
