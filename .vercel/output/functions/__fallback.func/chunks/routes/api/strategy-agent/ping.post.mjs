import { d as defineEventHandler, c as createError } from '../../../nitro/nitro.mjs';
import { p as pingHermesStrategyAgent } from '../../../_/hermes-strategy-client.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';

const ping_post = defineEventHandler(async () => {
  try {
    return await pingHermesStrategyAgent();
  } catch (err) {
    throw createError({
      statusCode: 502,
      statusMessage: "Hermes Agent remote call failed",
      data: { error: err instanceof Error ? err.message : "Hermes Agent remote call failed" }
    });
  }
});

export { ping_post as default };
//# sourceMappingURL=ping.post.mjs.map
