import { d as defineEventHandler } from '../../../nitro/nitro.mjs';
import { g as getState } from '../../../_/app-store.mjs';
import { b as buildCawReadiness } from '../../../_/caw-readiness.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:module';
import '../../../_/cobo-config.mjs';

const readiness_get = defineEventHandler(() => buildCawReadiness(getState()));

export { readiness_get as default };
//# sourceMappingURL=readiness.get.mjs.map
