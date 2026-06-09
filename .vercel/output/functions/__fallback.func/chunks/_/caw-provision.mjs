import { h as createCoboIdentityApi, e as extractCoboErrorMessage } from './cobo-client.mjs';
import { s as schedulePersistAppState } from './app-store.mjs';

async function provisionCawPrincipal(state, options) {
  var _a, _b, _c, _d, _e;
  const name = options.name.trim();
  if (!name) throw new Error("Agent name is required");
  const identityApi = (_a = options.identityApi) != null ? _a : createCoboIdentityApi(options.baseUrl);
  try {
    const resp = await identityApi.provisionAgent({ name });
    const payload = resp.data;
    if (payload.success === false) {
      throw new Error(payload.message || payload.suggestion || "CAW Principal provision failed");
    }
    const agentId = (_b = payload.result) == null ? void 0 : _b.agent_id;
    const apiKey = (_c = payload.result) == null ? void 0 : _c.api_key;
    const status = (_e = (_d = payload.result) == null ? void 0 : _d.status) != null ? _e : "unknown";
    if (!agentId || !apiKey) {
      throw new Error("CAW Principal provision response missing agent_id or api_key");
    }
    state.settings.agentId = agentId;
    state.settings.coboApiKey = apiKey;
    state.settings.apiKeyConfigured = true;
    schedulePersistAppState(state);
    return { agentId, status };
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("CAW Principal provision")) {
      throw err;
    }
    throw new Error(extractCoboErrorMessage(err));
  }
}

export { provisionCawPrincipal as p };
//# sourceMappingURL=caw-provision.mjs.map
