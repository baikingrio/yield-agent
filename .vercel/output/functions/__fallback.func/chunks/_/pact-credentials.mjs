import { a as getPactCredential, d as deletePactCredential, b as storePactCredential } from './app-store.mjs';
import { g as getCoboApiKey, c as createCoboPactsApi } from './cobo-client.mjs';
import 'node:fs';
import 'node:path';
import 'node:module';
import '@cobo/agentic-wallet';
import './cobo-config.mjs';

function cachePactCredentialFromCobo(state, pactId, coboPactId, apiKey) {
  if (apiKey == null ? void 0 : apiKey.trim()) {
    storePactCredential(pactId, apiKey.trim());
    const pact = state.pacts.find((item) => item.id === pactId || item.coboPactId === coboPactId);
    if (pact) pact.executionCredentialStored = true;
    return true;
  }
  return false;
}
async function refreshPactCredentialFromCobo(state, pactId) {
  var _a;
  const pact = state.pacts.find((item) => item.id === pactId || item.coboPactId === pactId);
  if (!(pact == null ? void 0 : pact.coboPactId) && !(pact == null ? void 0 : pact.id)) return null;
  const coboPactId = pact.coboPactId || pact.id;
  const pactsApi = createCoboPactsApi(state);
  const resp = await pactsApi.getPact(coboPactId);
  const apiKey = (_a = resp.data.result) == null ? void 0 : _a.api_key;
  if (cachePactCredentialFromCobo(state, pact.id, coboPactId, apiKey)) {
    return apiKey.trim();
  }
  return getPactCredential(pact.id);
}
function resolvePactExecutionApiKey(state, pactId) {
  return getPactCredential(pactId);
}
function revokeStoredPactCredential(pactId) {
  deletePactCredential(pactId);
}
async function resolveRedeemApiKey(state, pact) {
  var _a;
  if (pact.status === "active") {
    const cached = resolvePactExecutionApiKey(state, pact.id);
    if (cached) return cached;
    try {
      return await refreshPactCredentialFromCobo(state, pact.id);
    } catch {
      return null;
    }
  }
  if (pact.status === "terminated" || pact.status === "completed") {
    try {
      return getCoboApiKey(state);
    } catch {
      const env = (_a = process.env.AGENT_WALLET_API_KEY) == null ? void 0 : _a.trim();
      return env || null;
    }
  }
  return null;
}

export { cachePactCredentialFromCobo, refreshPactCredentialFromCobo, resolvePactExecutionApiKey, resolveRedeemApiKey, revokeStoredPactCredential };
//# sourceMappingURL=pact-credentials.mjs.map
