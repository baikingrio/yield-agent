import { createPublicClient, http, formatEther } from 'viem';
import { sepolia, baseSepolia, arbitrumSepolia } from 'viem/chains';
import { N as NETWORK_LABELS } from './app.mjs';

const MIN_NATIVE_ETH = 1e-4;
const RECOMMENDED_FUND_ETH = 1e-3;
const MIN_NATIVE_ETH_WEI = BigInt(Math.floor(MIN_NATIVE_ETH * 1e18));
const NATIVE_TOKEN_LABELS = {
  "base-sepolia": "Base Sepolia ETH",
  "arbitrum-sepolia": "Arbitrum Sepolia ETH"
};
const FAUCET_HINTS = {
  "base-sepolia": "https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet",
  "arbitrum-sepolia": "https://faucet.quicknode.com/arbitrum/sepolia"
};
function chainForNetwork(network) {
  return network === "base-sepolia" ? baseSepolia : arbitrumSepolia;
}
async function getAgentNativeEthBalance(network, address) {
  const client = createPublicClient({
    chain: chainForNetwork(network),
    transport: http()
  });
  return client.getBalance({ address });
}
async function detectWrongChainGasHint(network, address, requiredNetworkBalance) {
  if (hasEnoughAgentGas(requiredNetworkBalance)) return null;
  if (network === "base-sepolia") {
    const client = createPublicClient({ chain: sepolia, transport: http() });
    const sepoliaBalance = await client.getBalance({ address });
    if (!hasEnoughAgentGas(sepoliaBalance)) return null;
    const formatted = formatEther(sepoliaBalance);
    return {
      chainLabel: "Ethereum Sepolia",
      tokenLabel: "SETH",
      balance: formatted,
      message: `\u68C0\u6D4B\u5230 Agent Wallet \u5728 Ethereum Sepolia \u6709 ${formatted} SETH\uFF0C\u4F46\u672C\u7B56\u7565\u8FD0\u884C\u5728 Base Sepolia\uFF0C\u94FE\u4E0A Gas \u4E0D\u901A\u7528\u3002\u8BF7\u4E3A Base Sepolia \u5355\u72EC\u9886\u53D6\u6216\u8F6C\u5165 ETH\u3002`
    };
  }
  return null;
}
function buildAgentGasRequiredMessage(network, address, ethBalance, wrongChainHint) {
  const label = NETWORK_LABELS[network];
  const tokenLabel = NATIVE_TOKEN_LABELS[network];
  const faucet = FAUCET_HINTS[network];
  const formatted = formatEther(ethBalance);
  const lines = [
    `Agent Wallet \u7F3A\u5C11 ${tokenLabel} \u7528\u4E8E\u652F\u4ED8\u94FE\u4E0A Gas\uFF08${label} \u4F59\u989D ${formatted} ETH\uFF09\u3002`,
    `\u8BF7\u5148\u5411 ${address} \u8F6C\u5165\u81F3\u5C11 ${MIN_NATIVE_ETH} ${tokenLabel}\uFF0C\u7136\u540E\u91CD\u8BD5\u9996\u6B21 Recipe\u3002`,
    `\u6D4B\u8BD5\u7F51\u6C34\u9F99\u5934\uFF1A${faucet}`
  ];
  if (wrongChainHint) lines.splice(1, 0, wrongChainHint.message);
  return lines.join(" ");
}
function hasEnoughAgentGas(ethBalance) {
  return ethBalance >= MIN_NATIVE_ETH_WEI;
}
async function assertAgentWalletHasGas(network, address) {
  const balance = await getAgentNativeEthBalance(network, address);
  if (hasEnoughAgentGas(balance)) return;
  const wrongChainHint = await detectWrongChainGasHint(network, address, balance);
  throw new Error(buildAgentGasRequiredMessage(network, address, balance, wrongChainHint));
}
function resolveContractCallSponsor(ethBalance) {
  return !hasEnoughAgentGas(ethBalance);
}

export { FAUCET_HINTS as F, MIN_NATIVE_ETH as M, NATIVE_TOKEN_LABELS as N, RECOMMENDED_FUND_ETH as R, assertAgentWalletHasGas as a, detectWrongChainGasHint as d, getAgentNativeEthBalance as g, hasEnoughAgentGas as h, resolveContractCallSponsor as r };
//# sourceMappingURL=agent-gas.mjs.map
