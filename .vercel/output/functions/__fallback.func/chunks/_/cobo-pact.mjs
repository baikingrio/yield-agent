import { i as isCoboConfigured, a as isInvalidApiKeyError, e as extractCoboErrorMessage, c as createCoboPactsApi } from './cobo-client.mjs';
import { r as runCawJson } from './caw-wallet-bootstrap.mjs';
import { s as schedulePersistAppState } from './app-store.mjs';
import { b as getNetworkChainConfig, c as buildYieldContractCallTargets } from './cobo-config.mjs';
import { revokeStoredPactCredential } from './pact-credentials.mjs';

function str(value) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}
async function refreshApiKeyFromCli(state, options = {}) {
  var _a, _b;
  const existing = ((_a = state.settings.coboApiKey) == null ? void 0 : _a.trim()) || ((_b = process.env.AGENT_WALLET_API_KEY) == null ? void 0 : _b.trim());
  if (existing && !options.force) return true;
  try {
    const wallet = await runCawJson(["wallet", "current", "--show-api-key"], options.runner);
    if (Array.isArray(wallet)) return false;
    const apiKey = str(wallet.api_key);
    const agentId = str(wallet.agent_id);
    if (!apiKey) return false;
    state.settings.coboApiKey = apiKey;
    state.settings.apiKeyConfigured = true;
    if (agentId) state.settings.agentId = agentId;
    schedulePersistAppState(state);
    return true;
  } catch {
    return false;
  }
}

const NETWORK_NAMES = {
  "base-sepolia": "Base Sepolia \u6D4B\u8BD5\u7F51",
  "arbitrum-sepolia": "Arbitrum Sepolia \u6D4B\u8BD5\u7F51"
};
const RISK_NAMES = {
  conservative: "\u4FDD\u5B88\u578B\u6536\u76CA",
  balanced: "\u5E73\u8861\u578B\u6536\u76CA",
  aggressive: "\u6FC0\u8FDB\u578B\u6536\u76CA"
};
function strategyWhitelist(riskLevel, network) {
  const protocols = riskLevel === "aggressive" ? ["Aave \u5B58\u5165", "Compound \u5B58\u5165", "Uniswap \u5151\u6362"] : ["Aave \u5B58\u5165", "Compound \u5B58\u5165"];
  if (!getNetworkChainConfig(network).yieldProtocols.compoundComet) {
    return protocols.filter((item) => item !== "Compound \u5B58\u5165");
  }
  return protocols;
}
function resolvePactRecipeSlugs(_riskLevel) {
  var _a;
  const fromEnv = (_a = process.env.CAW_PACT_RECIPE_SLUGS) == null ? void 0 : _a.split(",").map((slug) => slug.trim()).filter(Boolean);
  return (fromEnv == null ? void 0 : fromEnv.length) ? fromEnv : [];
}
function mapCoboPactStatus(status) {
  switch (String(status != null ? status : "").toUpperCase()) {
    case "ACTIVE":
      return "active";
    case "COMPLETED":
      return "completed";
    case "TERMINATED":
    case "REVOKED":
    case "WITHDRAWN":
    case "REJECTED":
    case "EXPIRED":
      return "terminated";
    case "PENDING":
      return "pending";
    case "PENDING_APPROVAL":
    default:
      return "awaiting-approval";
  }
}
function resolveCoboPactSubmissionMessage(coboStatus, remoteMessage) {
  const normalized = String(coboStatus != null ? coboStatus : "").toUpperCase();
  const trimmed = remoteMessage == null ? void 0 : remoteMessage.trim();
  switch (normalized) {
    case "REVOKED":
      return "\u94B1\u5305\u4E3B\u4EBA\u5DF2\u5728 Cobo App \u64A4\u9500\u6B64 Pact\uFF0CAgent \u65E0\u6CD5\u518D\u6267\u884C\u3002";
    case "WITHDRAWN":
      return "Agent \u5DF2\u64A4\u56DE\u6B64 Pact \u63D0\u4EA4\u3002";
    case "REJECTED":
      return "\u94B1\u5305\u4E3B\u4EBA\u5DF2\u5728 Cobo App \u62D2\u7EDD\u6B64 Pact\u3002";
    case "EXPIRED":
      return "Pact \u5DF2\u8FC7\u671F\u3002";
    case "COMPLETED":
      return "Pact \u5DF2\u5B8C\u6210\u3002";
    case "ACTIVE":
      return trimmed || "Pact \u5DF2\u751F\u6548\uFF0C\u53EF\u6267\u884C Recipe\u3002";
    case "PENDING_APPROVAL":
      return trimmed || "Pact \u5DF2\u63D0\u4EA4\uFF0C\u8BF7\u5728 Cobo Agentic Wallet App \u4E2D\u5BA1\u6279\u3002";
    default:
      return trimmed;
  }
}
function localStatusLabel(status) {
  switch (status) {
    case "active":
      return "\u5DF2\u6FC0\u6D3B";
    case "completed":
      return "\u5DF2\u5B8C\u6210";
    case "terminated":
      return "\u5DF2\u7EC8\u6B62";
    case "pending":
      return "\u5F85\u5904\u7406";
    case "awaiting-approval":
    default:
      return "\u5F85\u5BA1\u6279";
  }
}
function applyCoboPactStatusToState(state, pactId, coboStatus, message) {
  var _a;
  const pact = state.pacts.find((item) => item.id === pactId || item.coboPactId === pactId);
  if (!pact) {
    throw new Error("Pact not found");
  }
  const previousStatus = pact.status;
  const nextStatus = mapCoboPactStatus(coboStatus);
  pact.status = nextStatus;
  pact.coboStatus = coboStatus ? String(coboStatus) : pact.coboStatus;
  pact.submissionMessage = (_a = resolveCoboPactSubmissionMessage(coboStatus, message)) != null ? _a : pact.submissionMessage;
  if (nextStatus === "terminated" || nextStatus === "completed") {
    revokeStoredPactCredential(pact.id);
    pact.executionCredentialStored = false;
  }
  const strategy = state.strategies.find((item) => item.id === pact.strategyId);
  if (strategy) {
    if (nextStatus === "terminated") {
      strategy.status = "paused";
    } else if (nextStatus === "completed") {
      strategy.status = "completed";
    } else if (nextStatus === "active" || nextStatus === "awaiting-approval" || nextStatus === "pending") {
      strategy.status = "active";
    }
  }
  if (previousStatus !== nextStatus) {
    state.logs.unshift({
      id: `log-${Date.now()}`,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      action: `Pact \u72B6\u6001\u5DF2\u540C\u6B65\uFF1A${previousStatus} \u2192 ${nextStatus}`,
      type: "pact",
      txHash: "",
      status: localStatusLabel(nextStatus),
      pactId: pact.id
    });
  }
  return pact;
}
async function syncCoboPactStatus(state, pactId, fetchStatus) {
  const pact = state.pacts.find((item) => item.id === pactId || item.coboPactId === pactId);
  if (!pact) {
    throw new Error("Pact not found");
  }
  if (pact.submissionMode !== "cobo") {
    return pact;
  }
  const coboPactId = pact.coboPactId || pact.id;
  const latest = await fetchStatus(coboPactId);
  return applyCoboPactStatusToState(state, pact.id, latest.status, latest.message);
}
async function refreshCoboPactStatus(state, pactId) {
  var _a;
  const localPact = state.pacts.find((item) => item.id === pactId || item.coboPactId === pactId);
  const localPactId = (_a = localPact == null ? void 0 : localPact.id) != null ? _a : pactId;
  const pact = await syncCoboPactStatus(state, pactId, async (coboPactId) => {
    const pactsApi = createCoboPactsApi(state);
    const resp = await pactsApi.getPact(coboPactId);
    const result = resp.data.result;
    if (mapCoboPactStatus(result.status) === "active" && result.api_key) {
      const { cachePactCredentialFromCobo } = await import('./pact-credentials.mjs');
      cachePactCredentialFromCobo(state, localPactId, coboPactId, result.api_key);
    }
    return {
      status: result.status,
      message: result.message
    };
  });
  return pact;
}
function chainTokenRef(networkConfig) {
  return {
    chain_id: networkConfig.coboChainId,
    token_id: networkConfig.coboTokenId
  };
}
function buildYieldPactPolicies(data) {
  const networkConfig = getNetworkChainConfig(data.network);
  const maxSpend = Number(data.maxSpend);
  const allowUniswap = data.riskLevel === "aggressive";
  const contractCallTxCap = allowUniswap ? 12 : 8;
  return [
    {
      name: "yieldagent-usdc-transfer-cap",
      type: "transfer",
      priority: 100,
      is_active: true,
      rules: {
        effect: "allow",
        when: {
          chain_in: [networkConfig.coboChainId],
          token_in: [chainTokenRef(networkConfig)]
        },
        deny_if: {
          amount_gt: String(maxSpend),
          usage_limits: {
            rolling_7d: {
              amount_gt: String(maxSpend)
            }
          }
        }
      }
    },
    {
      name: "yieldagent-allowlisted-yield-contract-calls",
      type: "contract_call",
      priority: 90,
      is_active: true,
      rules: {
        effect: "allow",
        when: {
          chain_in: [networkConfig.coboChainId],
          target_in: buildYieldContractCallTargets(data.network, data.riskLevel)
        },
        deny_if: {
          usage_limits: {
            rolling_7d: {
              tx_count_gt: contractCallTxCap
            }
          }
        }
      }
    }
  ];
}
function buildCompletionConditions() {
  return [
    { type: "time_elapsed", threshold: String(7 * 24 * 60 * 60) }
  ];
}
function buildYieldPactDraft(data) {
  var _a, _b;
  const riskLabel = (_a = RISK_NAMES[data.riskLevel]) != null ? _a : data.riskLevel;
  const apyPart = ((_b = data.targetApy) == null ? void 0 : _b.trim()) ? `\uFF0C\u76EE\u6807 APY ${data.targetApy}%` : "";
  const intent = `${riskLabel} \xB7 ${data.asset}\uFF08${NETWORK_NAMES[data.network]}\uFF09${apyPart}`;
  const whitelist = strategyWhitelist(data.riskLevel, data.network);
  const maxSpend = Number(data.maxSpend);
  const agentFee = Number(data.agentFee);
  const userSplit = Number(data.userSplit);
  const originalIntent = `\u7528\u6237\u5E0C\u671B\u521B\u5EFA ${intent}\uFF1A\u6700\u591A\u4F7F\u7528 ${maxSpend} ${data.asset}\uFF0C\u671F\u9650 7 \u5929\uFF0C\u53EA\u5141\u8BB8 ${whitelist.join(" / ")}\uFF0C\u6536\u76CA\u5206\u8D26\u4E3A\u7528\u6237 ${userSplit}%\u3001Agent ${100 - userSplit}%\uFF0CAgent \u7EE9\u6548\u8D39 ${agentFee}%\u3002`;
  const executionPlan = [
    "# Summary",
    `Create a bounded YieldAgent strategy for ${maxSpend} ${data.asset} on ${NETWORK_NAMES[data.network]}.`,
    "",
    "# Contract Operations",
    `1. Use only the CAW Agent Wallet funded by the user, never the user's EOA directly.`,
    `2. Execute only allowlisted yield actions: ${whitelist.join(", ")}.`,
    `3. Keep total spend within ${maxSpend} ${data.asset} for this Pact.`,
    "4. Record every allowed execution or denied attempt with status, reason, and transaction hash when available.",
    "",
    "# Risk Controls",
    "- Testnet only; no mainnet funds.",
    "- Reject non-allowlisted protocols, unknown tokens, leverage, LP, derivative, or over-budget actions.",
    `- Revenue split must remain user ${userSplit}% / agent ${100 - userSplit}%.`,
    "",
    "# Schedule",
    "- Pact ends after 7 days or after the configured transaction count threshold is reached."
  ].join("\n");
  return {
    name: `YieldAgent ${riskLabel}`,
    intent,
    originalIntent,
    recipeSlugs: resolvePactRecipeSlugs(data.riskLevel),
    spec: {
      policies: buildYieldPactPolicies(data),
      completion_conditions: buildCompletionConditions(),
      execution_plan: executionPlan
    }
  };
}
async function submitYieldPactToCobo(state, data, fallbackPactId) {
  const prep = state.walletPreparation;
  const draft = buildYieldPactDraft(data);
  const forceLocalDraft = process.env.CAW_FORCE_LOCAL_DRAFT === "true";
  if (!prep.agentWallet.coboWalletId || !isCoboConfigured(state)) {
    if (!forceLocalDraft) {
      throw new Error(
        "Cobo API \u672A\u914D\u7F6E\u3002\u8BF7\u5728\u8BBE\u7F6E\u9875\u586B\u5199 Cobo API Key\uFF0C\u6216\u914D\u7F6E AGENT_WALLET_API_KEY\u3002\u672C\u5730\u5F00\u53D1\u53EF\u8BBE\u7F6E CAW_FORCE_LOCAL_DRAFT=true\u3002"
      );
    }
    return {
      mode: "local-draft",
      pactId: fallbackPactId,
      status: "awaiting-approval",
      message: "Cobo API Key \u6216 Agent Wallet UUID \u672A\u914D\u7F6E\uFF0C\u5DF2\u521B\u5EFA\u672C\u5730 Pact draft\uFF0C\u672A\u63D0\u4EA4\u5230 Cobo\u3002"
    };
  }
  const request = {
    wallet_id: prep.agentWallet.coboWalletId,
    intent: draft.intent,
    original_intent: draft.originalIntent,
    name: draft.name,
    spec: draft.spec,
    ...draft.recipeSlugs.length ? { recipe_slugs: draft.recipeSlugs } : {}
  };
  const submitOnce = async () => {
    const pactsApi = createCoboPactsApi(state);
    const resp = await pactsApi.submitPact(request);
    const body = resp.data;
    if (body.success === false) {
      throw new Error(body.message || body.suggestion || "Cobo Pact \u63D0\u4EA4\u5931\u8D25");
    }
    const result = body.result;
    return {
      mode: "cobo",
      pactId: result.pact_id,
      status: mapCoboPactStatus(result.status),
      approvalId: result.approval_id,
      message: result.message || "Pact \u5DF2\u63D0\u4EA4\u5230 Cobo\uFF0C\u8BF7\u5728 Cobo Agentic Wallet App \u4E2D\u5BA1\u6279\u3002",
      coboStatus: String(result.status)
    };
  };
  try {
    return await submitOnce();
  } catch (err) {
    if (isInvalidApiKeyError(err)) {
      const refreshed = await refreshApiKeyFromCli(state, { force: true });
      if (refreshed) {
        try {
          return await submitOnce();
        } catch (retryErr) {
          const message2 = extractCoboErrorMessage(retryErr);
          if (!forceLocalDraft) throw new Error(message2);
          return {
            mode: "local-draft",
            pactId: fallbackPactId,
            status: "awaiting-approval",
            message: `Cobo Pact \u63D0\u4EA4\u6682\u4E0D\u53EF\u7528\uFF0C\u5DF2\u4FDD\u7559\u4E3A\u672C\u5730 Pact draft\uFF1A${message2}`
          };
        }
      }
    }
    const message = extractCoboErrorMessage(err);
    if (!forceLocalDraft) throw new Error(message);
    return {
      mode: "local-draft",
      pactId: fallbackPactId,
      status: "awaiting-approval",
      message: `Cobo Pact \u63D0\u4EA4\u6682\u4E0D\u53EF\u7528\uFF0C\u5DF2\u4FDD\u7559\u4E3A\u672C\u5730 Pact draft\uFF1A${message}`
    };
  }
}
const COBO_OWNER_REVOKE_MESSAGE = "\u751F\u6548\u4E2D\u7684 Cobo Pact \u53EA\u80FD\u7531\u94B1\u5305\u4E3B\u4EBA\u5728 Cobo Agentic Wallet App \u5185\u64A4\u9500\uFF08Agent API Key \u65E0 revoke \u6743\u9650\uFF09\u3002\u82E5\u5DF2\u6267\u884C\u5B58\u5165\uFF0C\u8BF7\u5148\u5728\u7F51\u9875\u70B9\u51FB\u300C\u8D4E\u56DE\u81F3 Agent Wallet\u300D\uFF0C\u518D\u5728 App \u64A4\u9500\uFF1B\u64A4\u9500\u540E\u8D44\u91D1\u4E0D\u4F1A\u81EA\u52A8\u4ECE Compound/Aave \u8FD4\u56DE\u3002";
function resolveCoboTerminateAction(pact) {
  if (pact.submissionMode !== "cobo" || !pact.coboPactId) return { type: "local_only" };
  if (pact.status === "awaiting-approval" || pact.status === "pending") return { type: "withdraw" };
  if (pact.status === "active") return { type: "owner_revoke_required" };
  return { type: "local_only" };
}

export { COBO_OWNER_REVOKE_MESSAGE as C, resolveCoboTerminateAction as a, buildYieldPactDraft as b, submitYieldPactToCobo as c, refreshCoboPactStatus as r, strategyWhitelist as s };
//# sourceMappingURL=cobo-pact.mjs.map
