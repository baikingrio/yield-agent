import { TransactionsApi, Configuration, TransactionRecordsApi } from '@cobo/agentic-wallet';
import { encodeFunctionData, erc20Abi, createPublicClient, http } from 'viem';
import { baseSepolia, arbitrumSepolia } from 'viem/chains';
import { a as assertAgentWalletHasGas, g as getAgentNativeEthBalance, r as resolveContractCallSponsor } from './agent-gas.mjs';
import { b as getNetworkChainConfig, g as getCoboBasePath } from './cobo-config.mjs';
import { e as extractCoboErrorMessage } from './cobo-client.mjs';
import { s as syncWalletSummaryFromCobo } from './cobo-preparation.mjs';
import { s as syncYieldSnapshotFromChain } from './yield-snapshot.mjs';
import { resolvePactExecutionApiKey, resolveRedeemApiKey } from './pact-credentials.mjs';
import { i as isStaleFirstExecution, r as resolveFirstSupplyAmountUsdc, n as nextFirstExecutionAttempt, t as toUsdcBaseUnits, a as resolveFirstYieldSupplyRoute, b as buildExecutionRequestId, e as encodeYieldSupplyCalldata, c as readYieldSuppliedAmount, d as nextRedeemAttempt, g as buildRedeemRequestId, h as encodeYieldWithdrawCalldata, j as isTerminalTransactionFailure, k as formatTransactionFailureMessage, l as isTerminalTransactionSuccess } from './yield-position.mjs';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
function chainForNetwork(network) {
  return network === "base-sepolia" ? baseSepolia : arbitrumSepolia;
}
function createPactScopedTransactionsApi(apiKey) {
  return new TransactionsApi(new Configuration({
    apiKey,
    basePath: getCoboBasePath(),
    baseOptions: { timeout: 6e4 }
  }));
}
function createPactScopedTransactionRecordsApi(apiKey) {
  return new TransactionRecordsApi(new Configuration({
    apiKey,
    basePath: getCoboBasePath(),
    baseOptions: { timeout: 6e4 }
  }));
}
function findPact(state, pactId) {
  return state.pacts.find((item) => item.id === pactId || item.coboPactId === pactId);
}
async function readUsdcAllowance(network, owner, spender, usdcContract) {
  const client = createPublicClient({
    chain: chainForNetwork(network),
    transport: http()
  });
  return client.readContract({
    address: usdcContract,
    abi: erc20Abi,
    functionName: "allowance",
    args: [owner, spender]
  });
}
async function waitForTransactionResult(recordsApi, walletId, requestId, stepLabel) {
  var _a;
  const maxAttempts = 45;
  const delayMs = 2e3;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const resp = await recordsApi.getUserTransactionByRequestId(walletId, requestId);
    const tx = resp.data.result;
    if (!tx) throw new Error("\u672A\u627E\u5230\u4EA4\u6613\u8BB0\u5F55\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5");
    if (isTerminalTransactionSuccess(tx.status, tx.status_display)) return tx;
    if (isTerminalTransactionFailure(tx.status, tx.status_display)) {
      throw new Error(formatTransactionFailureMessage(
        stepLabel,
        tx.status_display,
        tx.status,
        (_a = tx.data) == null ? void 0 : _a.failed_reason
      ));
    }
    if (attempt < maxAttempts - 1) await sleep(delayMs);
  }
  throw new Error(`${stepLabel}\u786E\u8BA4\u8D85\u65F6\uFF0C\u8BF7\u7A0D\u540E\u5728\u5386\u53F2\u8BB0\u5F55\u67E5\u770B\u72B6\u6001\u540E\u91CD\u8BD5`);
}
async function submitContractCallAndWait(transactionsApi, recordsApi, walletId, walletAddress, sponsor, params) {
  const resp = await transactionsApi.contractCall(walletId, {
    chain_id: params.chainId,
    contract_addr: params.contractAddr,
    calldata: params.calldata,
    src_addr: walletAddress,
    request_id: params.requestId,
    sponsor,
    description: params.description
  });
  const submit = resp.data.result;
  if (submit.pending_operation_id || submit.approval_id) {
    throw new Error("\u5408\u7EA6\u8C03\u7528\u5F85\u989D\u5916\u5BA1\u6279\uFF0C\u8BF7\u5728 Cobo App \u5B8C\u6210\u5BA1\u6279\u540E\u91CD\u8BD5");
  }
  if (isTerminalTransactionFailure(submit.status, submit.status_display)) {
    throw new Error(formatTransactionFailureMessage(
      params.stepLabel,
      submit.status_display,
      submit.status
    ));
  }
  if (isTerminalTransactionSuccess(submit.status, submit.status_display) && submit.transaction_hash) {
    const byRequest = await recordsApi.getUserTransactionByRequestId(walletId, params.requestId);
    return byRequest.data.result;
  }
  return waitForTransactionResult(recordsApi, walletId, params.requestId, params.stepLabel);
}
function appendExecutionLog(state, pactId, action, txHash, status) {
  state.logs.unshift({
    id: `log-${Date.now()}`,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    action,
    type: "supply",
    txHash,
    status,
    pactId
  });
}
async function executeFirstPactRecipe(state, pactId) {
  var _a, _b;
  const pact = findPact(state, pactId);
  if (!pact) throw new Error("Pact not found");
  if (pact.status !== "active") {
    throw new Error(pact.status === "completed" ? "Pact \u5DF2\u5728 Cobo \u4FA7\u5B8C\u6210\uFF08\u53EF\u80FD\u56E0\u5931\u8D25\u91CD\u8BD5\u89E6\u53D1\u4E86\u4EA4\u6613\u6B21\u6570\u4E0A\u9650\uFF09\u3002\u8BF7\u540C\u6B65\u72B6\u6001\u540E\u91CD\u65B0\u521B\u5EFA\u7B56\u7565\u4E0E Pact\u3002" : "Pact \u5C1A\u672A\u6FC0\u6D3B\uFF0C\u65E0\u6CD5\u6267\u884C Recipe");
  }
  if (pact.firstExecutionCompleted && ((_a = pact.firstExecutionTxHash) == null ? void 0 : _a.trim())) {
    return {
      txHash: pact.firstExecutionTxHash,
      status: "\u5DF2\u5B8C\u6210",
      coboTransactionId: void 0,
      action: "\u9996\u6B21 Recipe \u5DF2\u6267\u884C"
    };
  }
  if (isStaleFirstExecution(pact)) {
    pact.firstExecutionCompleted = false;
    pact.firstExecutionAt = void 0;
  }
  const apiKey = resolvePactExecutionApiKey(state, pact.id);
  if (!apiKey) throw new Error("\u672A\u627E\u5230 pact-scoped \u6267\u884C\u51ED\u8BC1\uFF0C\u8BF7\u540C\u6B65 Pact \u72B6\u6001\u540E\u91CD\u8BD5");
  const walletId = state.walletPreparation.agentWallet.coboWalletId;
  const walletAddress = state.walletPreparation.agentWallet.address;
  if (!walletId || !walletAddress) throw new Error("Agent Wallet \u672A\u5C31\u7EEA");
  const strategy = state.strategies.find((item) => item.id === pact.strategyId);
  const network = (_b = strategy == null ? void 0 : strategy.network) != null ? _b : state.walletPreparation.network;
  const chainConfig = getNetworkChainConfig(network);
  await assertAgentWalletHasGas(network, walletAddress);
  const nativeEth = await getAgentNativeEthBalance(network, walletAddress);
  const sponsor = resolveContractCallSponsor(nativeEth);
  const supplyUsdc = resolveFirstSupplyAmountUsdc(
    state.walletPreparation.funding.availableUsdc,
    pact.maxSpend
  );
  if (supplyUsdc <= 0) {
    throw new Error("Agent Wallet \u65E0\u53EF\u7528 USDC\uFF0C\u8BF7\u5148\u5B8C\u6210\u5145\u503C\u540E\u518D\u6267\u884C\u5B58\u5165");
  }
  const attempt = nextFirstExecutionAttempt(pact);
  pact.firstExecutionAttempt = attempt;
  const amount = toUsdcBaseUnits(supplyUsdc, chainConfig.usdcDecimals);
  const supplyRoute = resolveFirstYieldSupplyRoute(chainConfig);
  const transactionsApi = createPactScopedTransactionsApi(apiKey);
  const recordsApi = createPactScopedTransactionRecordsApi(apiKey);
  const approveRequestId = buildExecutionRequestId(pact.id, "approve", attempt);
  const supplyRequestId = buildExecutionRequestId(pact.id, "supply", attempt);
  const networkLabel = network === "arbitrum-sepolia" ? "Arbitrum Sepolia" : "Base Sepolia";
  const action = `${supplyRoute.protocolLabel} \u5B58\u5165 ${supplyUsdc} USDC\uFF08${networkLabel} \u6D4B\u8BD5\u7F51\uFF09`;
  try {
    const allowance = await readUsdcAllowance(
      network,
      walletAddress,
      supplyRoute.approveSpender,
      chainConfig.usdcContract
    );
    if (allowance < amount) {
      const approveCalldata = encodeFunctionData({
        abi: erc20Abi,
        functionName: "approve",
        args: [supplyRoute.approveSpender, amount]
      });
      await submitContractCallAndWait(transactionsApi, recordsApi, walletId, walletAddress, sponsor, {
        chainId: chainConfig.coboChainId,
        contractAddr: chainConfig.usdcContract,
        calldata: approveCalldata,
        requestId: approveRequestId,
        description: `YieldAgent approve USDC for ${supplyRoute.protocolLabel} (${supplyUsdc} USDC)`,
        stepLabel: `USDC \u6388\u6743 ${supplyRoute.protocolLabel}`
      });
    }
    const supplyCalldata = encodeYieldSupplyCalldata(
      supplyRoute,
      amount,
      walletAddress
    );
    const supplyTx = await submitContractCallAndWait(transactionsApi, recordsApi, walletId, walletAddress, sponsor, {
      chainId: chainConfig.coboChainId,
      contractAddr: supplyRoute.contractAddr,
      calldata: supplyCalldata,
      requestId: supplyRequestId,
      description: `YieldAgent ${supplyRoute.protocolLabel} supply (${supplyUsdc} USDC)`,
      stepLabel: `${supplyRoute.protocolLabel} \u5B58\u5165`
    });
    const txHash = supplyTx.transaction_hash || "";
    const status = supplyTx.status_display || "Success";
    pact.firstExecutionCompleted = true;
    pact.firstExecutionAt = (/* @__PURE__ */ new Date()).toISOString();
    pact.firstExecutionTxHash = txHash;
    appendExecutionLog(state, pact.id, action, txHash, status);
    await syncYieldSnapshotFromChain(state).catch(() => {
    });
    return {
      txHash,
      status,
      coboTransactionId: supplyTx.id,
      action
    };
  } catch (err) {
    pact.firstExecutionCompleted = false;
    pact.firstExecutionTxHash = "";
    appendExecutionLog(
      state,
      pact.id,
      action,
      "",
      err instanceof Error ? err.message : "\u6267\u884C\u5931\u8D25"
    );
    throw new Error(extractCoboErrorMessage(err));
  }
}
async function redeemPactFunds(state, pactId) {
  var _a, _b, _c;
  const pact = findPact(state, pactId);
  if (!pact) throw new Error("Pact not found");
  if (!pact.firstExecutionCompleted || !((_a = pact.firstExecutionTxHash) == null ? void 0 : _a.trim())) {
    throw new Error("\u6B64 Pact \u5C1A\u672A\u5B8C\u6210\u9996\u6B21\u5B58\u5165\uFF0C\u65E0\u9700\u8D4E\u56DE");
  }
  if (pact.redeemCompleted && ((_b = pact.redeemTxHash) == null ? void 0 : _b.trim())) {
    return {
      txHash: pact.redeemTxHash,
      status: "\u5DF2\u5B8C\u6210",
      amountUsdc: 0,
      action: "\u8D44\u91D1\u5DF2\u8D4E\u56DE"
    };
  }
  const apiKey = await resolveRedeemApiKey(state, pact);
  if (!apiKey) {
    throw new Error(
      pact.status === "active" ? "\u672A\u627E\u5230 pact-scoped \u6267\u884C\u51ED\u8BC1\uFF0C\u8BF7\u540C\u6B65 Pact \u72B6\u6001\u540E\u91CD\u8BD5" : "Pact \u5DF2\u64A4\u9500\u4E14\u7F3A\u5C11 Agent \u4E3B API Key\uFF0C\u65E0\u6CD5\u4EE3\u4E3A\u8D4E\u56DE\u3002\u8BF7\u5728\u8BBE\u7F6E\u9875\u914D\u7F6E Cobo API Key \u540E\u91CD\u8BD5\u3002"
    );
  }
  const walletId = state.walletPreparation.agentWallet.coboWalletId;
  const walletAddress = state.walletPreparation.agentWallet.address;
  if (!walletId || !walletAddress) throw new Error("Agent Wallet \u672A\u5C31\u7EEA");
  const strategy = state.strategies.find((item) => item.id === pact.strategyId);
  const network = (_c = strategy == null ? void 0 : strategy.network) != null ? _c : state.walletPreparation.network;
  const chainConfig = getNetworkChainConfig(network);
  const supplyRoute = resolveFirstYieldSupplyRoute(chainConfig);
  await assertAgentWalletHasGas(network, walletAddress);
  const nativeEth = await getAgentNativeEthBalance(network, walletAddress);
  const sponsor = resolveContractCallSponsor(nativeEth);
  const suppliedRaw = await readYieldSuppliedAmount(
    network,
    chainConfig,
    walletAddress
  );
  if (suppliedRaw <= /* @__PURE__ */ BigInt("0")) {
    pact.redeemCompleted = true;
    return {
      txHash: pact.redeemTxHash || "",
      status: "\u65E0\u4ED3\u4F4D",
      amountUsdc: 0,
      action: "\u94FE\u4E0A\u65E0\u5F85\u8D4E\u56DE\u4ED3\u4F4D\uFF08\u53EF\u80FD\u5DF2\u8D4E\u56DE\uFF09"
    };
  }
  const amountUsdc = Number(suppliedRaw) / 10 ** chainConfig.usdcDecimals;
  const attempt = nextRedeemAttempt(pact);
  pact.redeemAttempt = attempt;
  const transactionsApi = createPactScopedTransactionsApi(apiKey);
  const recordsApi = createPactScopedTransactionRecordsApi(apiKey);
  const requestId = buildRedeemRequestId(pact.id, attempt);
  const networkLabel = network === "arbitrum-sepolia" ? "Arbitrum Sepolia" : "Base Sepolia";
  const action = `${supplyRoute.protocolLabel} \u8D4E\u56DE ${amountUsdc} USDC \u81F3 Agent Wallet\uFF08${networkLabel}\uFF09`;
  const withdrawCalldata = encodeYieldWithdrawCalldata(
    supplyRoute,
    suppliedRaw,
    walletAddress
  );
  try {
    const redeemTx = await submitContractCallAndWait(
      transactionsApi,
      recordsApi,
      walletId,
      walletAddress,
      sponsor,
      {
        chainId: chainConfig.coboChainId,
        contractAddr: supplyRoute.contractAddr,
        calldata: withdrawCalldata,
        requestId,
        description: `YieldAgent ${supplyRoute.protocolLabel} withdraw (${amountUsdc} USDC)`,
        stepLabel: `${supplyRoute.protocolLabel} \u8D4E\u56DE`
      }
    );
    const txHash = redeemTx.transaction_hash || "";
    pact.redeemCompleted = true;
    pact.redeemTxHash = txHash;
    appendExecutionLog(state, pact.id, action, txHash, redeemTx.status_display || "Success");
    await syncWalletSummaryFromCobo(state);
    await syncYieldSnapshotFromChain(state).catch(() => {
    });
    return {
      txHash,
      status: redeemTx.status_display || "Success",
      amountUsdc,
      action
    };
  } catch (err) {
    appendExecutionLog(
      state,
      pact.id,
      action,
      "",
      err instanceof Error ? err.message : "\u8D4E\u56DE\u5931\u8D25"
    );
    throw new Error(extractCoboErrorMessage(err));
  }
}
async function simulatePactDenial(state, pactId) {
  var _a;
  const pact = findPact(state, pactId);
  if (!pact) throw new Error("Pact not found");
  const apiKey = resolvePactExecutionApiKey(state, pact.id) || state.settings.coboApiKey || process.env.AGENT_WALLET_API_KEY;
  if (!(apiKey == null ? void 0 : apiKey.trim())) throw new Error("\u7F3A\u5C11\u6267\u884C\u51ED\u8BC1\uFF0C\u65E0\u6CD5\u6A21\u62DF\u8D8A\u6743\u8BF7\u6C42");
  const walletId = state.walletPreparation.agentWallet.coboWalletId;
  if (!walletId) throw new Error("Agent Wallet \u672A\u5C31\u7EEA");
  const strategy = state.strategies.find((item) => item.id === pact.strategyId);
  const network = (_a = strategy == null ? void 0 : strategy.network) != null ? _a : state.walletPreparation.network;
  const chainConfig = getNetworkChainConfig(network);
  const transactionsApi = createPactScopedTransactionsApi(apiKey.trim());
  const walletAddress = state.walletPreparation.agentWallet.address;
  if (!walletAddress) throw new Error("Agent Wallet \u672A\u5C31\u7EEA");
  const deniedContract = "0x000000000000000000000000000000000000dEaD";
  const action = `Agent \u5C1D\u8BD5\u8C03\u7528\u975E\u767D\u540D\u5355\u5408\u7EA6 ${deniedContract.slice(0, 10)}\u2026\uFF08\u6A21\u62DF\u8D8A\u6743\uFF09`;
  try {
    await transactionsApi.contractCall(walletId, {
      chain_id: chainConfig.coboChainId,
      contract_addr: deniedContract,
      calldata: "0x",
      src_addr: walletAddress,
      sponsor: true,
      request_id: `yieldagent-denial-${pact.id}-${Date.now()}`
    });
    const reason = "\u8BF7\u6C42\u610F\u5916\u88AB\u63A5\u53D7\uFF1A\u8BF7\u68C0\u67E5 Pact policy \u914D\u7F6E";
    state.logs.unshift({
      id: `log-${Date.now()}`,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      action,
      type: "pact",
      txHash: "",
      status: "Denied",
      pactId: pact.id
    });
    return { action, reason, status: "Denied" };
  } catch (err) {
    const reason = extractCoboErrorMessage(err);
    state.logs.unshift({
      id: `log-${Date.now()}`,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      action,
      type: "pact",
      txHash: "",
      status: "Denied",
      pactId: pact.id
    });
    return {
      action,
      reason: reason.includes("deny") || reason.includes("\u62D2\u7EDD") || reason.includes("not allowed") ? reason : `Denied\uFF1A${reason}`,
      status: "Denied"
    };
  }
}

export { executeFirstPactRecipe as e, redeemPactFunds as r, simulatePactDenial as s };
//# sourceMappingURL=cobo-execution.mjs.map
