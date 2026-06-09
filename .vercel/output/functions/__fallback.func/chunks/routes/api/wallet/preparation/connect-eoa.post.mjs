import { d as defineEventHandler, r as readBody, c as createError } from '../../../../nitro/nitro.mjs';
import { z } from 'zod';
import { e as connectEoa, g as getState } from '../../../../_/app-store.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:module';

const schema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "\u65E0\u6548\u7684\u94B1\u5305\u5730\u5740"),
  label: z.string().optional()
});
const connectEoa_post = defineEventHandler(async (event) => {
  const body = await readBody(event);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw createError({ statusCode: 400, data: { error: "\u8BF7\u63D0\u4F9B\u6709\u6548\u7684 EOA \u94B1\u5305\u5730\u5740" } });
  }
  const state = getState();
  try {
    return connectEoa(state, {
      address: parsed.data.address,
      label: parsed.data.label
    });
  } catch (e) {
    const msg = e instanceof Error && e.message === "INVALID_EOA_ADDRESS" ? "\u65E0\u6548\u7684\u94B1\u5305\u5730\u5740" : "\u65E0\u6CD5\u767B\u8BB0 EOA \u8FDE\u63A5";
    throw createError({ statusCode: 400, data: { error: msg } });
  }
});

export { connectEoa_post as default };
//# sourceMappingURL=connect-eoa.post.mjs.map
