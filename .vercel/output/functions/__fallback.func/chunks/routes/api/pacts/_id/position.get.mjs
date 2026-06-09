import { d as defineEventHandler, a as getRouterParam, c as createError } from '../../../../nitro/nitro.mjs';
import { g as getState } from '../../../../_/app-store.mjs';
import { b as getNetworkChainConfig } from '../../../../_/cobo-config.mjs';
import { f as fetchYieldPositionSnapshot } from '../../../../_/yield-position.mjs';
import { f as findPactById } from '../../../../_/pact-lookup.mjs';
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

const position_get = defineEventHandler(async (event) => {
  var _a;
  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({ statusCode: 400, data: { error: "\u7F3A\u5C11 Pact ID" } });
  }
  const state = getState();
  const pact = findPactById(state, id);
  if (!pact) {
    throw createError({ statusCode: 404, data: { error: "Pact not found" } });
  }
  const walletAddress = state.walletPreparation.agentWallet.address;
  if (!walletAddress) {
    throw createError({ statusCode: 400, data: { error: "Agent Wallet \u672A\u5C31\u7EEA" } });
  }
  const strategy = state.strategies.find((item) => item.id === pact.strategyId);
  const network = (_a = strategy == null ? void 0 : strategy.network) != null ? _a : state.walletPreparation.network;
  const chainConfig = getNetworkChainConfig(network);
  const position = await fetchYieldPositionSnapshot(network, chainConfig, walletAddress);
  return {
    pactId: pact.id,
    status: pact.status,
    firstExecutionCompleted: Boolean(pact.firstExecutionCompleted && pact.firstExecutionTxHash),
    redeemCompleted: Boolean(pact.redeemCompleted && pact.redeemTxHash),
    ...position
  };
});

export { position_get as default };
//# sourceMappingURL=position.get.mjs.map
