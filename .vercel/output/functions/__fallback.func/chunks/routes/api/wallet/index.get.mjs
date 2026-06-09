import { d as defineEventHandler } from '../../../nitro/nitro.mjs';
import { c as getWalletPreparation, g as getState } from '../../../_/app-store.mjs';
import { d as detectBootstrapMode, s as syncPreparationFromCawCli } from '../../../_/caw-wallet-bootstrap.mjs';
import { a as syncFundingFromExistingBalance } from '../../../_/cobo-preparation.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:module';
import 'node:child_process';
import 'node:fs/promises';
import 'node:util';
import '../../../_/cobo-config.mjs';
import '../../../_/cobo-client.mjs';
import '@cobo/agentic-wallet';
import '../../../_/caw-onboard.mjs';
import '../../../_/caw-provision.mjs';
import 'viem';
import 'viem/chains';

const index_get = defineEventHandler(async () => {
  const state = getState();
  const prep = state.walletPreparation;
  if (prep.steps.eoa === "completed" && !prep.agentWallet.coboWalletId && !prep.agentWallet.created) {
    try {
      const mode = await detectBootstrapMode();
      if (mode === "cli-onboard") {
        await syncPreparationFromCawCli(state);
      }
    } catch {
    }
  }
  await syncFundingFromExistingBalance(state);
  return getWalletPreparation(state);
});

export { index_get as default };
//# sourceMappingURL=index.get.mjs.map
