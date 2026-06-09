import { g as getCoboBasePath, a as getCoboEnvironment } from './cobo-config.mjs';

function apiKeySource(state) {
  var _a, _b;
  if ((_a = state.settings.coboApiKey) == null ? void 0 : _a.trim()) return "settings";
  if ((_b = process.env.AGENT_WALLET_API_KEY) == null ? void 0 : _b.trim()) return "env";
  return "missing";
}
function nextActionFor(missing, readiness) {
  if (readiness.pactMode === "pact-execution-ready") {
    return "Pact \u5DF2\u6FC0\u6D3B\uFF0C\u53EF\u8FDB\u5165\u53D7\u9650\u7B56\u7565\u6267\u884C\u4E0E\u4EA4\u6613\u5BA1\u8BA1\u3002";
  }
  if (missing.includes("Cobo API Key")) {
    return "Provision \u6216\u914D\u7F6E Cobo API Key\uFF0C\u5F53\u524D\u53EA\u80FD\u521B\u5EFA\u672C\u5730 Pact Draft\u3002";
  }
  if (missing.includes("TSS Node ID")) {
    return "\u914D\u7F6E AGENT_WALLET_MAIN_NODE_ID\uFF0C\u5E76\u786E\u8BA4 TSS Node \u8FD0\u884C\u5728\u5F53\u524D Hermes Agent \u4E3B\u673A\u4E0A\uFF1B\u672C\u673A\u53EF\u8FD0\u884C caw node start\u3002";
  }
  if (missing.includes("TSS offline")) {
    return "TSS Node \u672A\u5728\u7EBF\u3002\u672C\u673A\u8FD0\u884C caw node start\uFF0C\u6216\u786E\u8BA4 Hermes \u4E3B\u673A TSS \u5E38\u9A7B\u3002";
  }
  if (missing.includes("Onboard incomplete")) {
    return "CAW onboard \u5C1A\u672A\u5B8C\u6210\u3002\u53EF\u5728 Wallet \u9875\u521B\u5EFA Agent Wallet\uFF0C\u6216\u5728\u8BBE\u7F6E\u9875\u63A8\u8FDB onboard\u3002";
  }
  if (missing.includes("Pairing pending")) {
    return "\u8BF7\u5728 CAW App \u8F93\u5165\u914D\u5BF9\u7801\u5B8C\u6210\u6240\u6709\u6743\u914D\u5BF9\u3002";
  }
  if (missing.includes("Agent Wallet")) {
    return "\u524D\u5F80 Wallet \u9875\u9762\u521B\u5EFA Agent Wallet \u5E76\u751F\u6210 EVM \u5730\u5740\u3002";
  }
  if (missing.includes("Funding")) {
    return "\u5411 Agent Wallet \u8F6C\u5165\u6D4B\u8BD5\u7F51 USDC \u5E76\u5B8C\u6210\u5230\u8D26\u786E\u8BA4\u3002";
  }
  return "CAW Pact \u63D0\u4EA4\u6761\u4EF6\u5DF2\u6EE1\u8DB3\uFF0C\u4E0B\u4E00\u6B65\u53EF\u521B\u5EFA\u7B56\u7565\u5E76\u63D0\u4EA4 Cobo Pact\u3002";
}
function buildCawReadiness(state) {
  var _a, _b, _c;
  const prep = state.walletPreparation;
  const source = apiKeySource(state);
  const apiKeyConfigured = source !== "missing";
  const mainNodeConfigured = Boolean((_a = process.env.AGENT_WALLET_MAIN_NODE_ID) == null ? void 0 : _a.trim());
  const agentWalletConfigured = Boolean(prep.agentWallet.created && prep.agentWallet.coboWalletId);
  const walletReady = prep.steps.agent_wallet === "completed" && agentWalletConfigured;
  const fundingReady = prep.ready && prep.funding.status === "ready" && prep.funding.availableUsdc > 0;
  const bootstrap = prep.agentBootstrap;
  const missing = [];
  if (!apiKeyConfigured) missing.push("Cobo API Key");
  if (!mainNodeConfigured) missing.push("TSS Node ID");
  if ((bootstrap == null ? void 0 : bootstrap.tssOnline) === false) missing.push("TSS offline");
  if (prep.steps.agent_wallet === "in_progress") missing.push("Onboard incomplete");
  if (agentWalletConfigured && ((_b = prep.agentWallet.pairing) == null ? void 0 : _b.status) !== "paired") {
    missing.push("Pairing pending");
  }
  if (!agentWalletConfigured) missing.push("Agent Wallet");
  if (!fundingReady) missing.push("Funding");
  const pactMode = apiKeyConfigured && agentWalletConfigured && fundingReady ? "cobo-pact" : "local-draft";
  const readiness = {
    environment: getCoboEnvironment(),
    apiBaseUrl: getCoboBasePath(),
    apiKeyConfigured,
    apiKeySource: source,
    mainNodeConfigured,
    tssRuntime: "hermes-agent-host",
    remoteRuntimeRequired: true,
    agentId: (_c = state.settings.agentId) != null ? _c : null,
    agentWalletConfigured,
    agentWalletAddress: prep.agentWallet.address || null,
    walletReady,
    fundingReady,
    pactMode,
    missing,
    nextAction: ""
  };
  readiness.nextAction = nextActionFor(missing, readiness);
  return readiness;
}

export { buildCawReadiness as b };
//# sourceMappingURL=caw-readiness.mjs.map
