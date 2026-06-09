import { d as defineEventHandler } from '../../../../nitro/nitro.mjs';
import { f as disconnectEoa, g as getState } from '../../../../_/app-store.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:module';

const disconnectEoa_post = defineEventHandler(() => {
  const state = getState();
  return disconnectEoa(state);
});

export { disconnectEoa_post as default };
//# sourceMappingURL=disconnect-eoa.post.mjs.map
