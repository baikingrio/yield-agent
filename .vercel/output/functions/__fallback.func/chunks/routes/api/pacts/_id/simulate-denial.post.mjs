import { d as defineEventHandler, a as getRouterParam, c as createError } from '../../../../nitro/nitro.mjs';
import { p as persistCurrentState, g as getState } from '../../../../_/app-store.mjs';
import { s as simulatePactDenial } from '../../../../_/cobo-execution.mjs';
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
import '../../../../_/cobo-client.mjs';
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

const simulateDenial_post = defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({ statusCode: 400, data: { error: "\u7F3A\u5C11 Pact ID" } });
  }
  const state = getState();
  const pact = findPactById(state, id);
  if (!pact) {
    throw createError({ statusCode: 404, data: { error: "Pact not found" } });
  }
  try {
    const result = await simulatePactDenial(state, pact.id);
    persistCurrentState();
    return result;
  } catch (err) {
    throw createError({
      statusCode: 502,
      data: { error: err instanceof Error ? err.message : "\u8D8A\u6743\u6A21\u62DF\u5931\u8D25" }
    });
  }
});

export { simulateDenial_post as default };
//# sourceMappingURL=simulate-denial.post.mjs.map
