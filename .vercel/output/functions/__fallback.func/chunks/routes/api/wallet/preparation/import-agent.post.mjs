import { d as defineEventHandler, c as createError } from '../../../../nitro/nitro.mjs';
import { g as getState } from '../../../../_/app-store.mjs';
import { i as importCoboAgentWalletFromCli } from '../../../../_/cobo-preparation.mjs';
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

const IMPORT_ERROR_MESSAGES = {
  EOA_NOT_CONNECTED: "\u8BF7\u5148\u8FDE\u63A5 EOA \u94B1\u5305",
  CAW_CURRENT_WALLET_NOT_FOUND: "\u672A\u627E\u5230\u5DF2 onboard \u7684 CAW \u94B1\u5305\u3002\u8BF7\u5148\u5728 Hermes \u4E3B\u673A\u8FD0\u884C caw onboard \u6216\u5728\u672C\u673A\u5B8C\u6210 onboard\u3002",
  CAW_ADDRESS_NOT_FOUND: "\u5DF2\u627E\u5230 CAW \u94B1\u5305\uFF0C\u4F46\u5C1A\u672A\u751F\u6210 EVM \u5730\u5740\u3002\u8BF7\u7B49\u5F85 onboard \u5B8C\u6210\u540E\u518D\u5BFC\u5165\u3002",
  CAW_CLI_NOT_FOUND: "\u672A\u68C0\u6D4B\u5230 caw CLI\u3002\u8BF7\u5B89\u88C5 caw \u5E76\u786E\u4FDD TSS Node \u5728\u7EBF\u3002"
};
const importAgent_post = defineEventHandler(async () => {
  var _a;
  const state = getState();
  try {
    return await importCoboAgentWalletFromCli(state);
  } catch (e) {
    const message = e instanceof Error ? (_a = IMPORT_ERROR_MESSAGES[e.message]) != null ? _a : e.message : "\u5BFC\u5165 CAW \u94B1\u5305\u5931\u8D25";
    throw createError({
      statusCode: 400,
      data: { error: message }
    });
  }
});

export { importAgent_post as default };
//# sourceMappingURL=import-agent.post.mjs.map
