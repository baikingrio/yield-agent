function normalizeBaseUrl(endpoint) {
  const trimmed = endpoint.trim().replace(/\/+$/, "");
  if (!trimmed) throw new Error("Hermes API URL is required");
  return trimmed.endsWith("/v1") ? trimmed : `${trimmed}/v1`;
}
function authKey(env) {
  var _a, _b;
  return ((_a = env.HERMES_API_KEY) == null ? void 0 : _a.trim()) || ((_b = env.API_SERVER_KEY) == null ? void 0 : _b.trim()) || void 0;
}
function buildHermesStrategyHeaders(apiKey) {
  return {
    "Content-Type": "application/json",
    ...apiKey ? { Authorization: `Bearer ${apiKey}` } : {}
  };
}
function buildHermesStrategyReadinessEnv(env = process.env) {
  var _a;
  const missing = [];
  if (!((_a = env.HERMES_API_URL) == null ? void 0 : _a.trim())) missing.push("Hermes API URL");
  if (!authKey(env)) missing.push("Hermes API Key");
  const remoteCallable = missing.length === 0;
  return { remoteCallable, deploymentReady: remoteCallable, missing };
}
async function callHermesStrategyAgent(options) {
  var _a, _b, _c, _d, _e, _f, _g;
  const baseUrl = normalizeBaseUrl(options.endpoint);
  const model = ((_a = options.model) == null ? void 0 : _a.trim()) || "hermes-agent";
  const fetcher = (_b = options.fetcher) != null ? _b : fetch;
  const resp = await fetcher(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: buildHermesStrategyHeaders(options.apiKey),
    body: JSON.stringify({
      model,
      messages: options.messages,
      stream: false
    })
  });
  const payload = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    throw new Error(((_c = payload.error) == null ? void 0 : _c.message) || `Hermes API call failed with HTTP ${resp.status}`);
  }
  const content = (_g = (_f = (_e = (_d = payload.choices) == null ? void 0 : _d[0]) == null ? void 0 : _e.message) == null ? void 0 : _f.content) == null ? void 0 : _g.trim();
  if (!content) throw new Error("Hermes API response missing assistant content");
  return {
    ok: true,
    endpoint: baseUrl,
    model,
    content
  };
}
async function pingHermesStrategyAgent(options = {}) {
  var _a, _b;
  const env = (_a = options.env) != null ? _a : process.env;
  const endpoint = (_b = env.HERMES_API_URL) == null ? void 0 : _b.trim();
  if (!endpoint) throw new Error("Hermes API URL is required");
  const result = await callHermesStrategyAgent({
    endpoint,
    apiKey: authKey(env),
    model: env.HERMES_STRATEGY_MODEL,
    fetcher: options.fetcher,
    messages: [
      {
        role: "system",
        content: "You are the Hermes strategy runtime for YieldAgent. Reply with a short JSON object only."
      },
      {
        role: "user",
        content: 'Return {"status":"ok","purpose":"strategy-runtime"}.'
      }
    ]
  });
  return {
    ok: result.ok,
    endpoint: result.endpoint,
    model: result.model,
    contentPreview: result.content.slice(0, 240)
  };
}

export { buildHermesStrategyReadinessEnv as b, callHermesStrategyAgent as c, pingHermesStrategyAgent as p };
//# sourceMappingURL=hermes-strategy-client.mjs.map
