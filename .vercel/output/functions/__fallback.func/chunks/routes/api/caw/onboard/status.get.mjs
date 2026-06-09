import { d as defineEventHandler, c as createError } from '../../../../nitro/nitro.mjs';
import { g as getCawOnboardStatus } from '../../../../_/caw-onboard.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:child_process';
import 'node:util';

const status_get = defineEventHandler(async () => {
  try {
    return await getCawOnboardStatus();
  } catch (err) {
    throw createError({
      statusCode: 502,
      statusMessage: "CAW onboard status failed",
      data: { error: err instanceof Error ? err.message : "CAW onboard status failed" }
    });
  }
});

export { status_get as default };
//# sourceMappingURL=status.get.mjs.map
