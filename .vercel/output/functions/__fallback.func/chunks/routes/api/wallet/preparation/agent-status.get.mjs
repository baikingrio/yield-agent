import { d as defineEventHandler, c as createError } from '../../../../nitro/nitro.mjs';
import { c as getWalletPreparation, g as getState } from '../../../../_/app-store.mjs';
import { p as pollCoboAgentWalletStatus, a as syncFundingFromExistingBalance } from '../../../../_/cobo-preparation.mjs';
import { C as CoboNotConfiguredError } from '../../../../_/cobo-client.mjs';
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
import '../../../../_/caw-wallet-bootstrap.mjs';
import 'node:child_process';
import 'node:fs/promises';
import 'node:util';
import '../../../../_/caw-onboard.mjs';
import '../../../../_/caw-provision.mjs';
import '@cobo/agentic-wallet';

const agentStatus_get = defineEventHandler(async () => {
  const state = getState();
  try {
    const response = await pollCoboAgentWalletStatus(state);
    await syncFundingFromExistingBalance(state);
    return {
      ...response,
      preparation: getWalletPreparation(state)
    };
  } catch (e) {
    if (e instanceof CoboNotConfiguredError) {
      throw createError({
        statusCode: 400,
        data: { error: "\u8BF7\u5148\u5728\u8BBE\u7F6E\u4E2D\u914D\u7F6E Cobo API Key" }
      });
    }
    if (e instanceof Error && e.message === "EOA_NOT_CONNECTED") {
      throw createError({ statusCode: 400, data: { error: "\u8BF7\u5148\u8FDE\u63A5 EOA \u94B1\u5305" } });
    }
    throw createError({
      statusCode: 400,
      data: { error: e instanceof Error ? e.message : "\u67E5\u8BE2 Agent Wallet \u72B6\u6001\u5931\u8D25" }
    });
  }
});

export { agentStatus_get as default };
//# sourceMappingURL=agent-status.get.mjs.map
