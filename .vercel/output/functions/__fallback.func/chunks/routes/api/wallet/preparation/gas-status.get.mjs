import { d as defineEventHandler, c as createError } from '../../../../nitro/nitro.mjs';
import { formatEther } from 'viem';
import { g as getState } from '../../../../_/app-store.mjs';
import { g as getAgentNativeEthBalance, d as detectWrongChainGasHint, F as FAUCET_HINTS, R as RECOMMENDED_FUND_ETH, M as MIN_NATIVE_ETH, N as NATIVE_TOKEN_LABELS, h as hasEnoughAgentGas } from '../../../../_/agent-gas.mjs';
import { N as NETWORK_LABELS } from '../../../../_/app.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:module';
import 'viem/chains';

const gasStatus_get = defineEventHandler(async () => {
  const prep = getState().walletPreparation;
  const address = prep.agentWallet.address;
  if (!address) {
    throw createError({ statusCode: 400, data: { error: "Agent Wallet \u672A\u5C31\u7EEA" } });
  }
  const balance = await getAgentNativeEthBalance(prep.network, address);
  const wrongChainHint = await detectWrongChainGasHint(prep.network, address, balance);
  return {
    network: prep.network,
    networkLabel: NETWORK_LABELS[prep.network],
    nativeTokenLabel: NATIVE_TOKEN_LABELS[prep.network],
    agentAddress: address,
    ethBalance: formatEther(balance),
    ready: hasEnoughAgentGas(balance),
    minEth: MIN_NATIVE_ETH,
    recommendedFundEth: RECOMMENDED_FUND_ETH,
    faucetUrl: FAUCET_HINTS[prep.network],
    wrongChainHint
  };
});

export { gasStatus_get as default };
//# sourceMappingURL=gas-status.get.mjs.map
