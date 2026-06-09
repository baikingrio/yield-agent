import { PactsApi, IdentityApi, Configuration, BalanceApi, WalletsApi } from '@cobo/agentic-wallet';
import { g as getCoboBasePath } from './cobo-config.mjs';

class CoboNotConfiguredError extends Error {
  constructor() {
    super("COBO_NOT_CONFIGURED");
  }
}
function getCoboApiKey(state) {
  var _a, _b;
  const key = ((_a = state.settings.coboApiKey) == null ? void 0 : _a.trim()) || ((_b = process.env.AGENT_WALLET_API_KEY) == null ? void 0 : _b.trim());
  if (!key) throw new CoboNotConfiguredError();
  return key;
}
function isCoboConfigured(state) {
  try {
    getCoboApiKey(state);
    return true;
  } catch {
    return false;
  }
}
const TRANSIENT_NETWORK_ERROR_CODES = /* @__PURE__ */ new Set([
  "ECONNRESET",
  "ETIMEDOUT",
  "ECONNABORTED",
  "ENOTFOUND",
  "EAI_AGAIN"
]);
function isTransientCoboNetworkError(err) {
  if (!err || typeof err !== "object") return false;
  const code = "code" in err ? String(err.code) : "";
  if (TRANSIENT_NETWORK_ERROR_CODES.has(code)) return true;
  const message = err instanceof Error ? err.message : String(err);
  return /ECONNRESET|ETIMEDOUT|ECONNABORTED|socket hang up|network error/i.test(message);
}
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function withCoboRetry(operation, options = {}) {
  var _a, _b;
  const maxAttempts = (_a = options.maxAttempts) != null ? _a : 3;
  const baseDelayMs = (_b = options.baseDelayMs) != null ? _b : 1e3;
  let lastErr;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      return await operation();
    } catch (err) {
      lastErr = err;
      const canRetry = isTransientCoboNetworkError(err) && attempt < maxAttempts - 1;
      if (!canRetry) throw err;
      await sleep(baseDelayMs * (attempt + 1));
    }
  }
  throw lastErr;
}
function createConfiguration(state) {
  return new Configuration({
    apiKey: getCoboApiKey(state),
    basePath: getCoboBasePath(),
    baseOptions: {
      timeout: 6e4
    }
  });
}
function createCoboWalletsApi(state) {
  return new WalletsApi(createConfiguration(state));
}
function createCoboBalanceApi(state) {
  return new BalanceApi(createConfiguration(state));
}
function createCoboPactsApi(state) {
  return new PactsApi(createConfiguration(state));
}
function createCoboIdentityApi(basePath) {
  return new IdentityApi(new Configuration({
    basePath: basePath != null ? basePath : getCoboBasePath(),
    baseOptions: {
      timeout: 6e4
    }
  }));
}
function humanizeCoboErrorMessage(message) {
  const normalized = message.trim().toLowerCase();
  if (normalized === "invalid_api_key" || normalized.includes("invalid api key")) {
    return "Cobo API Key \u65E0\u6548\u6216\u5DF2\u8FC7\u671F\u3002\u8BF7\u5728\u8BBE\u7F6E\u9875\u66F4\u65B0 Key\uFF0C\u6216\u524D\u5F80 Wallet \u91CD\u65B0\u5BFC\u5165/\u521B\u5EFA Agent Wallet \u4EE5\u540C\u6B65\u6700\u65B0\u51ED\u8BC1\u3002";
  }
  if (normalized.includes("not authorized for this wallet")) {
    return "\u5F53\u524D API Key \u65E0\u6743\u4E3A\u8BE5 Agent Wallet \u63D0\u4EA4 Pact\u3002\u8BF7\u786E\u8BA4 Wallet \u6B65\u9AA4 2 \u5DF2\u5B8C\u6210\u914D\u5BF9\uFF0C\u5E76\u4F7F\u7528\u5BF9\u5E94 Agent \u7684 API Key\u3002";
  }
  if (normalized.includes("recipe_slugs do not exist") || normalized.includes("recipe slug")) {
    return "\u5173\u8054\u7684 Recipe slug \u5728 Cobo \u73AF\u5883\u4E2D\u4E0D\u5B58\u5728\u3002\u9ED8\u8BA4\u5DF2\u7701\u7565\u5360\u4F4D slug\uFF1B\u82E5\u9700\u7ED1\u5B9A Recipe\uFF0C\u8BF7\u5728 .env \u8BBE\u7F6E CAW_PACT_RECIPE_SLUGS \u4E3A Cobo \u5E93\u4E2D\u5B58\u5728\u7684 slug\uFF08\u9017\u53F7\u5206\u9694\uFF09\u3002";
  }
  if (normalized.includes("not found or not accessible") || normalized.includes("pact not found")) {
    return "\u65E0\u6CD5\u4EE5 Agent \u8EAB\u4EFD\u64A4\u9500\u8BE5 Pact\u3002\u5F85\u5BA1\u6279 Pact \u8BF7\u4F7F\u7528\u300C\u64A4\u56DE\u63D0\u4EA4\u300D\uFF1B\u751F\u6548\u4E2D\u7684 Pact \u9700\u7531\u94B1\u5305\u4E3B\u4EBA\u5728 Cobo Agentic Wallet App \u5185\u64A4\u9500\u3002";
  }
  if (normalized.includes("validation error") || normalized.includes("pact policies only support effect")) {
    return "Pact \u7B56\u7565\u683C\u5F0F\u4E0D\u7B26\u5408 Cobo \u8981\u6C42\u3002\u8BF7\u786E\u8BA4 token_in \u4F7F\u7528 chain_id + token_id \u5BF9\u8C61\uFF0C\u4E14\u7B56\u7565\u4EC5\u4F7F\u7528 effect=allow\uFF08\u901A\u8FC7 deny_if \u9650\u5236\u989D\u5EA6\uFF09\u3002";
  }
  return message;
}
function isInvalidApiKeyError(err) {
  const raw = extractRawCoboError(err).toLowerCase();
  return raw === "invalid_api_key" || raw.includes("invalid api key");
}
function formatCoboValidationDetail(detail) {
  if (!Array.isArray(detail) || detail.length === 0) return null;
  const parts = detail.map((item) => {
    var _a;
    if (!item || typeof item !== "object") return null;
    const field = "loc" in item && Array.isArray(item.loc) ? item.loc.at(-1) : null;
    const msg = "msg" in item ? String((_a = item.msg) != null ? _a : "") : "";
    if (!field || !msg) return msg || null;
    return `${String(field)}: ${msg}`;
  }).filter((part) => Boolean(part));
  return parts.length ? parts.join("\uFF1B") : null;
}
function extractRawCoboError(err) {
  var _a;
  if (err && typeof err === "object" && "response" in err) {
    const data = (_a = err.response) == null ? void 0 : _a.data;
    if (typeof (data == null ? void 0 : data.error) === "string") return data.error;
    if ((data == null ? void 0 : data.error) && typeof data.error === "object") {
      if (data.error.reason) return data.error.reason;
      const validation = formatCoboValidationDetail(data.error.detail);
      if (validation) return validation;
    }
    if (data == null ? void 0 : data.message) return data.message;
    if (data == null ? void 0 : data.suggestion) return data.suggestion;
  }
  if (err instanceof Error) return err.message;
  if (err && typeof err === "object" && "message" in err && typeof err.message === "string") {
    return err.message;
  }
  return "";
}
function extractCoboErrorMessage(err) {
  if (err instanceof CoboNotConfiguredError) {
    return "\u8BF7\u5148\u5728\u8BBE\u7F6E\u4E2D\u914D\u7F6E Cobo API Key\uFF0C\u6216\u8BBE\u7F6E AGENT_WALLET_API_KEY \u73AF\u5883\u53D8\u91CF";
  }
  if (isTransientCoboNetworkError(err)) {
    return "\u8FDE\u63A5 Cobo API \u88AB\u4E2D\u65AD\uFF08\u7F51\u7EDC\u4E0D\u7A33\u5B9A\u6216 TSS Node \u6682\u65F6\u4E0D\u53EF\u8FBE\uFF09\u3002\u8BF7\u786E\u8BA4 `caw node status` \u663E\u793A online \u540E\u91CD\u8BD5\u300C\u7EE7\u7EED\u521D\u59CB\u5316\u300D\u3002";
  }
  const raw = extractRawCoboError(err);
  if (raw) return humanizeCoboErrorMessage(raw);
  return "Cobo API \u8BF7\u6C42\u5931\u8D25";
}

export { CoboNotConfiguredError as C, isInvalidApiKeyError as a, createCoboBalanceApi as b, createCoboPactsApi as c, isTransientCoboNetworkError as d, extractCoboErrorMessage as e, createCoboWalletsApi as f, getCoboApiKey as g, createCoboIdentityApi as h, isCoboConfigured as i, withCoboRetry as w };
//# sourceMappingURL=cobo-client.mjs.map
