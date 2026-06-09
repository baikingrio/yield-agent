import { d as defineEventHandler } from '../../nitro/nitro.mjs';
import { g as getState } from '../../_/app-store.mjs';
import { s as syncWalletSummaryFromCobo } from '../../_/cobo-preparation.mjs';
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
import '../../_/cobo-config.mjs';
import '../../_/cobo-client.mjs';
import '@cobo/agentic-wallet';
import '../../_/caw-wallet-bootstrap.mjs';
import 'node:child_process';
import 'node:fs/promises';
import 'node:util';
import '../../_/caw-onboard.mjs';
import '../../_/caw-provision.mjs';

const wallet_get = defineEventHandler(async () => {
  const state = getState();
  await syncWalletSummaryFromCobo(state);
  return state.wallet;
});

export { wallet_get as default };
//# sourceMappingURL=wallet.get.mjs.map
