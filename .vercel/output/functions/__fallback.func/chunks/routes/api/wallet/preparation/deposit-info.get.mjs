import { d as defineEventHandler, g as getQuery, c as createError } from '../../../../nitro/nitro.mjs';
import { z } from 'zod';
import { g as getState } from '../../../../_/app-store.mjs';
import { b as getNetworkChainConfig } from '../../../../_/cobo-config.mjs';
import { i as isCoboConfigured } from '../../../../_/cobo-client.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:module';
import '@cobo/agentic-wallet';

const schema = z.object({
  amountUsdc: z.coerce.number().min(10).max(1e4)
});
const depositInfo_get = defineEventHandler((event) => {
  const query = getQuery(event);
  const parsed = schema.safeParse(query);
  if (!parsed.success) {
    throw createError({ statusCode: 400, data: { error: "\u8BF7\u8F93\u5165 10\u201310,000 USDC" } });
  }
  const state = getState();
  const prep = state.walletPreparation;
  if (prep.steps.agent_wallet !== "completed" || !prep.agentWallet.address) {
    throw createError({ statusCode: 400, data: { error: "\u8BF7\u5148\u521B\u5EFA Agent Wallet" } });
  }
  if (!isCoboConfigured(state)) {
    throw createError({ statusCode: 400, data: { error: "\u8BF7\u5148\u5728\u8BBE\u7F6E\u4E2D\u914D\u7F6E Cobo API Key" } });
  }
  const networkConfig = getNetworkChainConfig(prep.network);
  return {
    agentAddress: prep.agentWallet.address,
    usdcContract: networkConfig.usdcContract,
    decimals: networkConfig.usdcDecimals,
    chainId: networkConfig.evmChainId,
    coboChainId: networkConfig.coboChainId,
    coboTokenId: networkConfig.coboTokenId,
    minAmount: parsed.data.amountUsdc
  };
});

export { depositInfo_get as default };
//# sourceMappingURL=deposit-info.get.mjs.map
