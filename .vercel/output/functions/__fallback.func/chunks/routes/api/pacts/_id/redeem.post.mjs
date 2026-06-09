import { d as defineEventHandler, a as getRouterParam, c as createError } from '../../../../nitro/nitro.mjs';
import { p as persistCurrentState, g as getState } from '../../../../_/app-store.mjs';
import { r as redeemPactFunds } from '../../../../_/cobo-execution.mjs';
import { e as extractCoboErrorMessage } from '../../../../_/cobo-client.mjs';
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
import 'viem';
import 'viem/chains';
import '../../../../_/agent-gas.mjs';
import '../../../../_/app.mjs';
import '../../../../_/cobo-config.mjs';
import '../../../../_/cobo-preparation.mjs';
import '../../../../_/caw-wallet-bootstrap.mjs';
import 'node:child_process';
import 'node:fs/promises';
import 'node:util';
import '../../../../_/caw-onboard.mjs';
import '../../../../_/caw-provision.mjs';
import '../../../../_/yield-snapshot.mjs';
import '../../../../_/yield-position.mjs';
import '../../../../_/pact-credentials.mjs';

const redeem_post = defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({ statusCode: 400, data: { error: "\u7F3A\u5C11 Pact ID" } });
  }
  const state = getState();
  const pact = findPactById(state, id);
  if (!pact) {
    throw createError({ statusCode: 404, data: { error: "Pact not found" } });
  }
  if (pact.submissionMode !== "cobo") {
    throw createError({ statusCode: 400, data: { error: "\u4EC5 Cobo Pact \u652F\u6301\u94FE\u4E0A\u8D4E\u56DE" } });
  }
  try {
    const result = await redeemPactFunds(state, pact.id);
    persistCurrentState();
    return result;
  } catch (err) {
    persistCurrentState();
    throw createError({
      statusCode: 502,
      data: { error: err instanceof Error ? err.message : extractCoboErrorMessage(err) }
    });
  }
});

export { redeem_post as default };
//# sourceMappingURL=redeem.post.mjs.map
