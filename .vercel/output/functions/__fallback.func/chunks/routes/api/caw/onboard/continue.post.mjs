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
  sessionId: z.string().trim().min(1),
  answers: z.record(z.string(), z.unknown()).default({}),
  wait: z.boolean().optional()
});
const continue_post = defineEventHandler(async (event) => {
  const parsed = Body.safeParse(await readBody(event).catch(() => ({})));
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: "Invalid CAW onboard continue request" });
  }
  try {
    return await runCawOnboardStep({
      sessionId: parsed.data.sessionId,
      answers: parsed.data.answers,
      wait: parsed.data.wait
    });
  } catch (err) {
    throw createError({
      statusCode: 502,
      statusMessage: "CAW onboard continue failed",
      data: { error: err instanceof Error ? err.message : "CAW onboard continue failed" }
    });
  }
});

export { continue_post as default };
//# sourceMappingURL=continue.post.mjs.map
