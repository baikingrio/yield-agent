import { d as defineEventHandler, a as getRouterParam, c as createError } from '../../../../nitro/nitro.mjs';
import { p as persistCurrentState, g as getState } from '../../../../_/app-store.mjs';
import { c as createCoboPactsApi, e as extractCoboErrorMessage } from '../../../../_/cobo-client.mjs';
import { a as resolveCoboTerminateAction, r as refreshCoboPactStatus, C as COBO_OWNER_REVOKE_MESSAGE } from '../../../../_/cobo-pact.mjs';
import { revokeStoredPactCredential } from '../../../../_/pact-credentials.mjs';
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

const terminate_post = defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({ statusCode: 400, data: { error: "\u7F3A\u5C11 Pact ID" } });
  }
  const state = getState();
  const pact = findPactById(state, id);
  if (!pact) {
    throw createError({ statusCode: 404, data: { error: "Pact not found" } });
  }
  const action = resolveCoboTerminateAction(pact);
  if (action.type === "owner_revoke_required") {
    throw createError({
      statusCode: 400,
      data: {
        error: COBO_OWNER_REVOKE_MESSAGE,
        code: "COBO_OWNER_REVOKE_REQUIRED"
      }
    });
  }
  if (action.type === "withdraw" && pact.coboPactId) {
    try {
      const pactsApi = createCoboPactsApi(state);
      await pactsApi.withdrawPact(pact.coboPactId);
    } catch (err) {
      throw createError({
        statusCode: 502,
        data: { error: extractCoboErrorMessage(err) }
      });
    }
    revokeStoredPactCredential(pact.id);
    try {
      const synced = await refreshCoboPactStatus(state, pact.id);
      persistCurrentState();
      return synced;
    } catch {
    }
  }
  if (pact.submissionMode === "cobo") {
    revokeStoredPactCredential(pact.id);
  }
  pact.status = "terminated";
  const strategy = state.strategies.find((s) => s.id === pact.strategyId);
  if (strategy) {
    strategy.status = "paused";
  }
  persistCurrentState();
  return pact;
});

export { terminate_post as default };
//# sourceMappingURL=terminate.post.mjs.map
