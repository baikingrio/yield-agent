import { d as defineEventHandler } from '../../nitro/nitro.mjs';
import { g as getState } from '../../_/app-store.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:module';

const index_get = defineEventHandler(() => {
  return getState().strategies;
});

export { index_get as default };
//# sourceMappingURL=index.get4.mjs.map
