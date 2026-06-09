import { d as defineEventHandler, g as getQuery } from '../../nitro/nitro.mjs';
import { p as persistCurrentState, g as getState } from '../../_/app-store.mjs';
import { r as refreshCoboPactStatus } from '../../_/cobo-pact.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:module';
import '../../_/cobo-client.mjs';
import '@cobo/agentic-wallet';
import '../../_/cobo-config.mjs';
import '../../_/caw-wallet-bootstrap.mjs';
import 'node:child_process';
import 'node:fs/promises';
import 'node:util';
import '../../_/caw-onboard.mjs';
import '../../_/caw-provision.mjs';
import '../../_/pact-credentials.mjs';

const STATUSES = ["pending", "active", "completed", "terminated", "awaiting-approval"];
const index_get = defineEventHandler(async (event) => {
  const query = getQuery(event);
  const status = typeof query.status === "string" ? query.status : void 0;
  const state = getState();
  if (query.sync === "true") {
    await Promise.all(
      state.pacts.filter((pact) => pact.submissionMode === "cobo").map(async (pact) => {
        try {
          await refreshCoboPactStatus(state, pact.id);
        } catch {
        }
      })
    );
    persistCurrentState();
  }
  let pacts = state.pacts;
  if (status && STATUSES.includes(status)) {
    pacts = pacts.filter((p) => p.status === status);
  }
  return pacts;
});

export { index_get as default };
//# sourceMappingURL=index.get2.mjs.map
