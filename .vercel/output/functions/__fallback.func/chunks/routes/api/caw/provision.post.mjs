import { d as defineEventHandler, r as readBody, c as createError, s as setResponseStatus } from '../../../nitro/nitro.mjs';
import { z } from 'zod';
import { g as getState } from '../../../_/app-store.mjs';
import { b as buildCawReadiness } from '../../../_/caw-readiness.mjs';
import { p as provisionCawPrincipal } from '../../../_/caw-provision.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:module';
import '../../../_/cobo-config.mjs';
import '../../../_/cobo-client.mjs';
import '@cobo/agentic-wallet';

const schema = z.object({
  name: z.string().trim().min(2).max(80).default("YieldAgent Dev")
});
const provision_post = defineEventHandler(async (event) => {
  const parsed = schema.safeParse(await readBody(event));
  if (!parsed.success) {
    throw createError({ statusCode: 400, data: { error: "Agent \u540D\u79F0\u65E0\u6548" } });
  }
  const state = getState();
  try {
    const provision = await provisionCawPrincipal(state, { name: parsed.data.name });
    setResponseStatus(event, 201);
    return {
      provision,
      readiness: buildCawReadiness(state)
    };
  } catch (err) {
    throw createError({
      statusCode: 502,
      data: { error: err instanceof Error ? err.message : "CAW Agent provision \u5931\u8D25" }
    });
  }
});

export { provision_post as default };
//# sourceMappingURL=provision.post.mjs.map
