import { d as defineEventHandler, r as readBody, c as createError } from '../../nitro/nitro.mjs';
import { z } from 'zod';
import { g as getState } from '../../_/app-store.mjs';
import { t as toPublicSettings } from '../../_/settings.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:module';

const schema = z.object({
  network: z.enum(["base-sepolia", "arbitrum-sepolia"]).optional(),
  defaultAgentFee: z.number().min(0).max(30).optional(),
  userSplit: z.number().min(0).max(100).optional(),
  apiKey: z.string().optional()
});
const index_put = defineEventHandler(async (event) => {
  var _a;
  const body = await readBody(event);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw createError({ statusCode: 400, data: { error: "\u8BF7\u6C42\u53C2\u6570\u65E0\u6548" } });
  }
  const settings = getState().settings;
  const data = parsed.data;
  if (data.network) settings.network = data.network;
  if (data.defaultAgentFee !== void 0) settings.defaultAgentFee = data.defaultAgentFee;
  if (data.userSplit !== void 0) settings.userSplit = data.userSplit;
  if ((_a = data.apiKey) == null ? void 0 : _a.trim()) {
    settings.coboApiKey = data.apiKey.trim();
    settings.apiKeyConfigured = true;
  }
  return toPublicSettings(settings);
});

export { index_put as default };
//# sourceMappingURL=index.put.mjs.map
