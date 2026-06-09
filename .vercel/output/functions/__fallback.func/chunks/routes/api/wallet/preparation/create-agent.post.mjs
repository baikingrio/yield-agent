import { d as defineEventHandler, c as createError } from '../../../../nitro/nitro.mjs';
import { g as getState } from '../../../../_/app-store.mjs';
import { c as createCoboAgentWallet } from '../../../../_/cobo-preparation.mjs';
import { C as CoboNotConfiguredError, e as extractCoboErrorMessage } from '../../../../_/cobo-client.mjs';
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

const WALLET_ERROR_MESSAGES = {
  TSS_NOT_CONFIGURED: "\u672A\u68C0\u6D4B\u5230\u53EF\u7528\u7684 TSS \u8FD0\u884C\u65F6\u3002\u8BF7\u5728\u672C\u673A\u5B89\u88C5 caw \u5E76\u542F\u52A8 TSS Node\uFF0C\u6216\u914D\u7F6E AGENT_WALLET_MAIN_NODE_ID\u3002",
  TSS_NODE_OFFLINE: "TSS Node \u672A\u5728\u7EBF\u3002\u672C\u673A\u8BF7\u8FD0\u884C caw node start\uFF1B\u8FDC\u7A0B\u8BF7\u786E\u8BA4 Hermes \u4E3B\u673A TSS \u5728\u7EBF\u4E14 MAIN_NODE_ID \u6B63\u786E\u3002",
  WALLET_STILL_PREPARING: "Agent Wallet \u4ECD\u5728\u521D\u59CB\u5316\uFF08vault \u5C1A\u672A\u5C31\u7EEA\uFF09\u3002\u8BF7\u786E\u8BA4 TSS Node \u5728\u7EBF\uFF0C\u7CFB\u7EDF\u4F1A\u81EA\u52A8\u7EED\u63A5\u521D\u59CB\u5316\u3002",
  WALLET_NOT_ACTIVE: "Agent Wallet \u5C1A\u672A\u6FC0\u6D3B\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5\u3002",
  WALLET_ARCHIVED: "Agent Wallet \u5DF2\u5F52\u6863\uFF0C\u8BF7\u91CD\u7F6E\u8D44\u91D1\u51C6\u5907\u6D41\u7A0B\u540E\u91CD\u65B0\u521B\u5EFA\u3002",
  ADDRESS_NOT_CREATED: "\u672A\u80FD\u751F\u6210 Agent \u94FE\u4E0A\u5730\u5740\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5\u3002",
  AGENT_WALLET_NOT_READY: "Agent Wallet \u5C1A\u672A\u5C31\u7EEA\uFF0C\u8BF7\u5148\u5B8C\u6210\u521B\u5EFA\u3002"
};
function walletCreationErrorMessage(err) {
  if (err instanceof Error && WALLET_ERROR_MESSAGES[err.message]) {
    return WALLET_ERROR_MESSAGES[err.message];
  }
  return extractCoboErrorMessage(err);
}
const createAgent_post = defineEventHandler(async () => {
  var _a;
  const state = getState();
  try {
    const prep = await createCoboAgentWallet(state);
    const bootstrap = (_a = prep.agentBootstrap) != null ? _a : null;
    return { preparation: prep, bootstrap, done: prep.steps.agent_wallet === "completed" };
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
      data: { error: walletCreationErrorMessage(e) }
    });
  }
});

export { createAgent_post as default };
//# sourceMappingURL=create-agent.post.mjs.map
