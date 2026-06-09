import { d as defineEventHandler, r as readBody, c as createError } from '../../../../nitro/nitro.mjs';
import { z } from 'zod';
import { r as runCawOnboardStep } from '../../../../_/caw-onboard.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:child_process';
import 'node:util';

const Body = z.object({
  agentName: z.string().trim().min(1).default("YieldAgent"),
  wait: z.boolean().optional()
});
const start_post = defineEventHandler(async (event) => {
  const parsed = Body.safeParse(await readBody(event).catch(() => ({})));
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: "Invalid CAW onboard start request" });
  }
  try {
    return await runCawOnboardStep({
      agentName: parsed.data.agentName,
      wait: parsed.data.wait
    });
  } catch (err) {
    throw createError({
      statusCode: 502,
      statusMessage: "CAW onboard start failed",
      data: { error: err instanceof Error ? err.message : "CAW onboard start failed" }
    });
  }
});

export { start_post as default };
//# sourceMappingURL=start.post.mjs.map
