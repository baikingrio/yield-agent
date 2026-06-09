import { encodeFunctionData, createPublicClient, http } from 'viem';
import { baseSepolia, arbitrumSepolia } from 'viem/chains';

function resolveFirstSupplyAmountUsdc(availableUsdc, maxSpend) {
  const amount = Math.min(availableUsdc, maxSpend);
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  return amount;
}
function isStaleFirstExecution(pact) {
  var _a;
  return Boolean(pact.firstExecutionCompleted && !((_a = pact.firstExecutionTxHash) == null ? void 0 : _a.trim()));
}
function nextFirstExecutionAttempt(pact) {
  var _a;
  return ((_a = pact.firstExecutionAttempt) != null ? _a : 0) + 1;
}
function buildExecutionRequestId(pactId, step, attempt) {
  return `yieldagent-${pactId}-${step}-a${attempt}`;
}
const aavePoolSupplyAbi = [{
  type: "function",
  name: "supply",
  inputs: [
    { name: "asset", type: "address" },
    { name: "amount", type: "uint256" },
    { name: "onBehalfOf", type: "address" },
    { name: "referralCode", type: "uint16" }
  ],
  outputs: [],
  stateMutability: "nonpayable"
}];
const compoundSupplyAbi = [{
  type: "function",
  name: "supply",
  inputs: [
    { name: "asset", type: "address" },
    { name: "amount", type: "uint256" }
  ],
  outputs: [],
  stateMutability: "nonpayable"
}];
function resolveFirstYieldSupplyRoute(chainConfig) {
  var _a;
  const aaveAsset = (_a = chainConfig.aaveUsdcContract) != null ? _a : chainConfig.usdcContract;
  const fundingMatchesAave = chainConfig.usdcContract.toLowerCase() === aaveAsset.toLowerCase();
  if (!fundingMatchesAave && chainConfig.yieldProtocols.compoundComet) {
    return {
      protocol: "compound",
      protocolLabel: "Compound",
      approveSpender: chainConfig.yieldProtocols.compoundComet,
      contractAddr: chainConfig.yieldProtocols.compoundComet,
      asset: chainConfig.usdcContract
    };
  }
  return {
    protocol: "aave",
    protocolLabel: "Aave",
    approveSpender: chainConfig.yieldProtocols.aavePool,
    contractAddr: chainConfig.yieldProtocols.aavePool,
    asset: aaveAsset
  };
}
const compoundWithdrawAbi = [{
  type: "function",
  name: "withdraw",
  inputs: [
    { name: "asset", type: "address" },
    { name: "amount", type: "uint256" }
  ],
  outputs: [],
  stateMutability: "nonpayable"
}];
const aaveWithdrawAbi = [{
  type: "function",
  name: "withdraw",
  inputs: [
    { name: "asset", type: "address" },
    { name: "amount", type: "uint256" },
    { name: "to", type: "address" }
  ],
  outputs: [],
  stateMutability: "nonpayable"
}];
function buildRedeemRequestId(pactId, attempt) {
  return `yieldagent-${pactId}-redeem-a${attempt}`;
}
function nextRedeemAttempt(pact) {
  var _a;
  return ((_a = pact.redeemAttempt) != null ? _a : 0) + 1;
}
function encodeYieldWithdrawCalldata(route, amount, walletAddress) {
  if (route.protocol === "compound") {
    return encodeFunctionData({
      abi: compoundWithdrawAbi,
      functionName: "withdraw",
      args: [route.asset, amount]
    });
  }
  return encodeFunctionData({
    abi: aaveWithdrawAbi,
    functionName: "withdraw",
    args: [route.asset, amount, walletAddress]
  });
}
function encodeYieldSupplyCalldata(route, amount, walletAddress) {
  if (route.protocol === "compound") {
    return encodeFunctionData({
      abi: compoundSupplyAbi,
      functionName: "supply",
      args: [route.asset, amount]
    });
  }
  return encodeFunctionData({
    abi: aavePoolSupplyAbi,
    functionName: "supply",
    args: [route.asset, amount, walletAddress, 0]
  });
}
function formatTransactionFailureMessage(step, statusDisplay, status, failedReason) {
  const detail = (failedReason == null ? void 0 : failedReason.trim()) || (statusDisplay && statusDisplay !== "Failed" ? statusDisplay : "") || (status ? String(status) : "");
  const suffix = detail ? `\uFF1A${detail}` : "";
  return `${step}\u5931\u8D25${suffix}\u3002\u8BF7\u68C0\u67E5 Gas\u3001USDC \u4F59\u989D\u4E0E\u534F\u8BAE\u6388\u6743\u540E\u91CD\u8BD5\u3002`;
}
function toUsdcBaseUnits(amountUsdc, decimals) {
  return BigInt(Math.floor(amountUsdc * 10 ** decimals));
}
function isTerminalTransactionSuccess(status, statusDisplay) {
  const display = statusDisplay == null ? void 0 : statusDisplay.trim().toLowerCase();
  return status === 900 || display === "success";
}
function isTerminalTransactionFailure(status, statusDisplay) {
  const display = statusDisplay == null ? void 0 : statusDisplay.trim().toLowerCase();
  return status === 901 || status === 902 || status === 903 || display === "failed" || display === "rejected" || display === "cancelled";
}

const compoundBalanceAbi = [{
  type: "function",
  name: "balanceOf",
  inputs: [{ name: "account", type: "address" }],
  outputs: [{ type: "uint256" }],
  stateMutability: "view"
}];
function chainForNetwork(network) {
  return network === "base-sepolia" ? baseSepolia : arbitrumSepolia;
}
async function readYieldSuppliedAmount(network, chainConfig, walletAddress) {
  const route = resolveFirstYieldSupplyRoute(chainConfig);
  const client = createPublicClient({
    chain: chainForNetwork(network),
    transport: http()
  });
  if (route.protocol === "compound" && chainConfig.yieldProtocols.compoundComet) {
    return client.readContract({
      address: chainConfig.yieldProtocols.compoundComet,
      abi: compoundBalanceAbi,
      functionName: "balanceOf",
      args: [walletAddress]
    });
  }
  return /* @__PURE__ */ BigInt("0");
}
async function fetchYieldPositionSnapshot(network, chainConfig, walletAddress) {
  const route = resolveFirstYieldSupplyRoute(chainConfig);
  const raw = await readYieldSuppliedAmount(
    network,
    chainConfig,
    walletAddress
  );
  const suppliedUsdc = Number(raw) / 10 ** chainConfig.usdcDecimals;
  return {
    protocol: route.protocolLabel,
    suppliedUsdc,
    redeemable: raw > /* @__PURE__ */ BigInt("0")
  };
}

export { resolveFirstYieldSupplyRoute as a, buildExecutionRequestId as b, readYieldSuppliedAmount as c, nextRedeemAttempt as d, encodeYieldSupplyCalldata as e, fetchYieldPositionSnapshot as f, buildRedeemRequestId as g, encodeYieldWithdrawCalldata as h, isStaleFirstExecution as i, isTerminalTransactionFailure as j, formatTransactionFailureMessage as k, isTerminalTransactionSuccess as l, nextFirstExecutionAttempt as n, resolveFirstSupplyAmountUsdc as r, toUsdcBaseUnits as t };
//# sourceMappingURL=yield-position.mjs.map
