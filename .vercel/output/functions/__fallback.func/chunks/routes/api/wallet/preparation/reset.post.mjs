import { d as defineEventHandler } from '../../../../nitro/nitro.mjs';
import { r as resetWalletPreparation, g as getState } from '../../../../_/app-store.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:module';

const reset_post = defineEventHandler(() => {
  const state = getState();
  return resetWalletPreparation(state);
});

export { reset_post as default };
//# sourceMappingURL=reset.post.mjs.map
