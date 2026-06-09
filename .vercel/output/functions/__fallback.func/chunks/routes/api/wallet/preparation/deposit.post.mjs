import { d as defineEventHandler, r as readBody, c as createError } from '../../../../nitro/nitro.mjs';
import { z } from 'zod';
import { p as persistCurrentState, g as getState } from '../../../../_/app-store.mjs';
import { b as confirmUsdcDeposit } from '../../../../_/cobo-preparation.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:module';
import 'viem';
import 'viem/chains';
import '../../../../_/cobo-config.mjs';
import '../../../../_/cobo-client.mjs';
import '@cobo/agentic-wallet';
import '../../../../_/caw-wallet-bootstrap.mjs';
import 'node:child_process';
import 'node:fs/promises';
import 'node:util';
import '../../../../_/caw-onboard.mjs';
import '../../../../_/caw-provision.mjs';

const TX_HASH_RE = /^0x[a-fA-F0-9]{64}$/;
const schema = z.object({
  amountUsdc: z.number().min(10).max(1e4),
  txHash: z.string().regex(TX_HASH_RE, "\u65E0\u6548\u7684\u4EA4\u6613\u54C8\u5E0C")
});
const deposit_post = defineEventHandler(async (event) => {
  const body = await readBody(event);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw createError({ statusCode: 400, data: { error: "\u8BF7\u63D0\u4F9B\u6709\u6548\u7684\u91D1\u989D\u4E0E\u4EA4\u6613\u54C8\u5E0C" } });
  }
  const state = getState();
  try {
    const result = await confirmUsdcDeposit(state, parsed.data.amountUsdc, parsed.data.txHash);
    state.logs.unshift({
      id: `log-deposit-${Date.now()}`,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      action: `EOA \u2192 Agent Wallet \u6CE8\u5165 ${parsed.data.amountUsdc} USDC`,
      type: "supply",
      txHash: parsed.data.txHash,
      status: "\u6210\u529F"
    });
    persistCurrentState();
    return result;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "\u8F6C\u5165\u5931\u8D25\uFF0C\u8BF7\u91CD\u8BD5";
    throw createError({ statusCode: 400, data: { error: msg } });
  }
});

export { deposit_post as default };
//# sourceMappingURL=deposit.post.mjs.map
