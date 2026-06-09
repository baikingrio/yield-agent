import { execFile } from 'node:child_process';
import { access } from 'node:fs/promises';
import { constants } from 'node:fs';
import { promisify } from 'node:util';
import { b as getNetworkChainConfig } from './cobo-config.mjs';
import { d as isTransientCoboNetworkError, f as createCoboWalletsApi, w as withCoboRetry, e as extractCoboErrorMessage } from './cobo-client.mjs';
import { r as runCawOnboardStep } from './caw-onboard.mjs';
import { p as provisionCawPrincipal } from './caw-provision.mjs';
import { m as markAgentWalletCreated, i as markAgentWalletPreparing, s as schedulePersistAppState, t as touchPreparation } from './app-store.mjs';

const execFileAsync = promisify(execFile);
function str(value) {
  return typeof value === "string" && value.trim() ? value : null;
}
function bool(value) {
  return value === true;
}
function isStringArray(value) {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}
function defaultBootstrapState() {
  return {
    mode: null,
    phase: "idle",
    sessionId: null,
    walletStatus: null,
    tssOnline: null,
    message: null
  };
}
function getBootstrapState(prep) {
  var _a;
  return (_a = prep.agentBootstrap) != null ? _a : defaultBootstrapState();
}
function setBootstrapState(state, patch) {
  const prep = state.walletPreparation;
  const next = { ...getBootstrapState(prep), ...patch };
  prep.agentBootstrap = next;
  touchPreparation(prep, state);
  return next;
}
function isBootstrapDone(prep) {
  var _a;
  return prep.steps.agent_wallet === "completed" && prep.agentWallet.created && ((_a = prep.agentWallet.pairing) == null ? void 0 : _a.status) === "paired";
}
async function resolveCawCliBin() {
  var _a;
  const configured = (_a = process.env.CAW_CLI_BIN) == null ? void 0 : _a.trim();
  if (configured) {
    try {
      await access(configured, constants.X_OK);
      return configured;
    } catch {
      return null;
    }
  }
  try {
    const { stdout } = await execFileAsync("which", ["caw"]);
    return stdout.trim() || null;
  } catch {
    return null;
  }
}
async function defaultCawRunner(args) {
  var _a;
  const cawBin = await resolveCawCliBin();
  if (!cawBin) throw new Error("CAW_CLI_NOT_FOUND");
  const { stdout, stderr } = await execFileAsync(cawBin, args, {
    timeout: 12e4,
    maxBuffer: 1024 * 1024,
    env: {
      ...process.env,
      PATH: `/usr/local/bin:${(_a = process.env.PATH) != null ? _a : ""}`
    }
  });
  return { stdout, stderr };
}
async function runCawJson(args, runner = defaultCawRunner) {
  const { stdout } = await runner(args);
  const parsed = JSON.parse(stdout || "{}");
  if (Array.isArray(parsed)) return parsed;
  return parsed && typeof parsed === "object" ? parsed : {};
}
async function runCawJsonBestEffort(args, runner = defaultCawRunner) {
  try {
    return await runCawJson(args, runner);
  } catch (err) {
    const stdout = err && typeof err === "object" && "stdout" in err ? err.stdout : null;
    if (typeof stdout === "string" && stdout.trim()) {
      const parsed = JSON.parse(stdout);
      if (Array.isArray(parsed)) return parsed;
      return parsed && typeof parsed === "object" ? parsed : {};
    }
    throw err;
  }
}
async function detectBootstrapMode(runner = defaultCawRunner) {
  var _a;
  const cawBin = await resolveCawCliBin();
  if (cawBin) {
    try {
      const health = await runCawJson(["node", "health"], runner);
      if (bool(health.healthy)) {
        return "cli-onboard";
      }
    } catch {
    }
  }
  const mainNodeId = (_a = process.env.AGENT_WALLET_MAIN_NODE_ID) == null ? void 0 : _a.trim();
  if (mainNodeId) return "sdk-create";
  return "unavailable";
}
async function checkTssReadiness(state, walletId, runner = defaultCawRunner) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j;
  const cawBin = await resolveCawCliBin();
  if (cawBin) {
    try {
      const status = await runCawJsonBestEffort(["node", "status"], runner);
      const remote = status.remote;
      const local = status.local;
      const online = bool(remote == null ? void 0 : remote.online) || bool(local == null ? void 0 : local.running);
      return {
        online,
        nodeId: str(remote == null ? void 0 : remote.tss_node_id),
        source: "cli-local",
        message: online ? "TSS Node \u5728\u7EBF" : "TSS Node \u672A\u5728\u7EBF\uFF0C\u8BF7\u8FD0\u884C caw node start"
      };
    } catch {
    }
  }
  const targetWalletId = walletId != null ? walletId : state.walletPreparation.agentWallet.coboWalletId;
  if (targetWalletId && ((_a = state.settings.coboApiKey) == null ? void 0 : _a.trim())) {
    try {
      const walletsApi = createCoboWalletsApi(state);
      const nodeResp = await withCoboRetry(() => walletsApi.getWalletNodeStatus(targetWalletId));
      const online = ((_b = nodeResp.data.result) == null ? void 0 : _b.online) === true;
      return {
        online,
        nodeId: (_f = (_e = str((_c = nodeResp.data.result) == null ? void 0 : _c.tss_node_id)) != null ? _e : (_d = process.env.AGENT_WALLET_MAIN_NODE_ID) == null ? void 0 : _d.trim()) != null ? _f : null,
        source: "sdk-remote",
        message: online ? "\u8FDC\u7A0B TSS Node \u5728\u7EBF" : "\u8FDC\u7A0B TSS Node \u672A\u5728\u7EBF"
      };
    } catch {
      return {
        online: false,
        nodeId: (_h = (_g = process.env.AGENT_WALLET_MAIN_NODE_ID) == null ? void 0 : _g.trim()) != null ? _h : null,
        source: "sdk-remote",
        message: "\u65E0\u6CD5\u67E5\u8BE2\u8FDC\u7A0B TSS Node \u72B6\u6001"
      };
    }
  }
  return {
    online: false,
    nodeId: (_j = (_i = process.env.AGENT_WALLET_MAIN_NODE_ID) == null ? void 0 : _i.trim()) != null ? _j : null,
    source: "none",
    message: "\u8BF7\u5148\u914D\u7F6E TSS Node \u6216\u5B8C\u6210 CAW onboard"
  };
}
function currentCoboApiKey(state) {
  var _a, _b;
  return ((_a = state.settings.coboApiKey) == null ? void 0 : _a.trim()) || ((_b = process.env.AGENT_WALLET_API_KEY) == null ? void 0 : _b.trim()) || null;
}
async function syncCredentialsFromCli(state, runner = defaultCawRunner) {
  if (currentCoboApiKey(state)) return true;
  try {
    const wallet = await runCawJson(["wallet", "current", "--show-api-key"], runner);
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
async function ensureCawCredentials(state) {
  if (currentCoboApiKey(state)) return;
  if (await syncCredentialsFromCli(state)) return;
  if (state.settings.agentId) return;
  await provisionCawPrincipal(state, { name: "YieldAgent Dev" });
}
async function initiateWalletPairingApi(state, walletId) {
  var _a, _b, _c, _d;
  if (!currentCoboApiKey(state)) return void 0;
  try {
    const walletsApi = createCoboWalletsApi(state);
    const resp = await withCoboRetry(() => walletsApi.initiateWalletPair({ wallet_id: walletId }));
    const payload = resp.data;
    if (payload.success === false) {
      throw new Error(payload.message || payload.suggestion || "CAW wallet pairing failed");
    }
    return {
      status: "pairing",
      code: (_b = (_a = payload.result) == null ? void 0 : _a.token) != null ? _b : null,
      expiresAt: (_d = (_c = payload.result) == null ? void 0 : _c.expires_at) != null ? _d : null
    };
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("CAW wallet pairing")) {
      throw err;
    }
    throw new Error(extractCoboErrorMessage(err));
  }
}
async function initiateWalletPairingCli(runner) {
  var _a, _b, _c, _d;
  try {
    const payload = await runCawJson(["wallet", "pair", "--code-only"], runner);
    if (Array.isArray(payload)) return void 0;
    const code = (_b = (_a = str(payload.token)) != null ? _a : str(payload.code)) != null ? _b : str(payload.pairing_code);
    return {
      status: "pairing",
      code,
      expiresAt: (_d = (_c = str(payload.expires_at)) != null ? _c : str(payload.expire_at)) != null ? _d : null
    };
  } catch {
    return void 0;
  }
}
function parsePairStatusPayload(payload) {
  var _a, _b, _c, _d;
  const tokenStatus = (_a = str(payload.token_status)) == null ? void 0 : _a.toLowerCase();
  if (tokenStatus === "completed") return "paired";
  if (tokenStatus === "valid" || tokenStatus === "paired") return "pairing";
  if (tokenStatus === "expired" || tokenStatus === "not_found") return "unpaired";
  if (payload.paired === true || payload.wallet_paired === true) return "paired";
  const status = (_d = (_b = str(payload.status)) == null ? void 0 : _b.toLowerCase()) != null ? _d : (_c = str(payload.pair_status)) == null ? void 0 : _c.toLowerCase();
  if (status === "paired" || status === "completed") return "paired";
  if (status === "pairing" || status === "pending" || status === "active") return "pairing";
  if (tokenStatus === "pending" || tokenStatus === "active") return "pairing";
  if (str(payload.token) || str(payload.code) || str(payload.pairing_code)) return "pairing";
  return "unpaired";
}
async function pollPairStatusCli(runner) {
  try {
    const payload = await runCawJson(["wallet", "pair-status"], runner);
    if (Array.isArray(payload)) return "unpaired";
    return parsePairStatusPayload(payload);
  } catch {
    return "unpaired";
  }
}
async function pollPairStatusApi(state, walletId) {
  if (!currentCoboApiKey(state)) return "unpaired";
  try {
    const walletsApi = createCoboWalletsApi(state);
    const resp = await withCoboRetry(() => walletsApi.getPairInfoByWallet(walletId));
    return parsePairStatusPayload(resp.data.result);
  } catch {
    return "unpaired";
  }
}
async function pollPairStatus(state, walletId, runner = defaultCawRunner) {
  const mode = getBootstrapState(state.walletPreparation).mode;
  if (mode === "cli-onboard") {
    const cliStatus = await pollPairStatusCli(runner);
    if (cliStatus !== "unpaired") return cliStatus;
  }
  return pollPairStatusApi(state, walletId);
}
async function resolvePairingStatus(state, walletUuid, runner = defaultCawRunner) {
  var _a;
  const prep = state.walletPreparation;
  const pairStatus = await pollPairStatus(state, walletUuid, runner);
  if (pairStatus === "paired") {
    return { status: "paired", code: null, expiresAt: null };
  }
  const existing = prep.agentWallet.pairing;
  if ((existing == null ? void 0 : existing.status) === "pairing" && existing.code) {
    return existing;
  }
  const mode = getBootstrapState(prep).mode;
  const initiated = mode === "cli-onboard" ? (_a = await initiateWalletPairingCli(runner)) != null ? _a : await initiateWalletPairingApi(state, walletUuid) : await initiateWalletPairingApi(state, walletUuid);
  return initiated != null ? initiated : { status: "unpaired", code: null, expiresAt: null };
}
async function pollPairingForReadyWallet(state) {
  const prep = state.walletPreparation;
  const walletUuid = prep.agentWallet.coboWalletId;
  const address = prep.agentWallet.address;
  if (!walletUuid || !address) {
    return buildStatusResponse(state, false);
  }
  const pairing = await resolvePairingStatus(state, walletUuid);
  if (pairing.status === "paired") {
    setBootstrapState(state, { phase: "paired", message: "CAW App \u914D\u5BF9\u5DF2\u5B8C\u6210" });
  } else if (pairing.status === "pairing") {
    setBootstrapState(state, { phase: "pairing", message: "\u8BF7\u5728 CAW App \u8F93\u5165\u914D\u5BF9\u7801" });
  } else {
    setBootstrapState(state, { phase: "active", message: "\u94B1\u5305\u5DF2 active\uFF0C\u53EF\u751F\u6210\u914D\u5BF9\u7801" });
  }
  markAgentWalletCreated(state, { address, coboWalletId: walletUuid, pairing });
  return buildStatusResponse(state, pairing.status === "paired");
}
async function resolveEvmAddressFromCli(state, walletUuid, runner) {
  var _a;
  const networkConfig = getNetworkChainConfig(state.walletPreparation.network);
  try {
    const payload = await runCawJson(["address", "list"], runner);
    if (!Array.isArray(payload)) return null;
    const match = payload.find((item) => {
      if (!item || typeof item !== "object") return false;
      const obj = item;
      const compatibleChains = obj.compatible_chains;
      return str(obj.wallet_id) === walletUuid && str(obj.address) && (isStringArray(compatibleChains) && compatibleChains.includes(networkConfig.coboChainId) || str(obj.chain_type) === "ETH");
    });
    return (_a = str(match == null ? void 0 : match.address)) != null ? _a : null;
  } catch {
    return null;
  }
}
async function resolveEvmAddressFromSdk(state, walletUuid) {
  var _a, _b, _c, _d, _e;
  const networkConfig = getNetworkChainConfig(state.walletPreparation.network);
  const walletsApi = createCoboWalletsApi(state);
  try {
    const addrResp = await withCoboRetry(() => walletsApi.createWalletAddress(walletUuid, {
      chain_id: networkConfig.coboChainId
    }));
    const created = (_a = addrResp.data.result) == null ? void 0 : _a.address;
    if (created) return created;
  } catch {
  }
  try {
    const listResp = await withCoboRetry(() => walletsApi.listWalletAddresses(walletUuid));
    const addresses = (_b = listResp.data.result) != null ? _b : [];
    const match = addresses.find(
      (item) => {
        var _a2;
        return ((_a2 = item.compatible_chains) == null ? void 0 : _a2.includes(networkConfig.coboChainId)) || item.chain_type === "ETH";
      }
    );
    return (_e = (_d = match == null ? void 0 : match.address) != null ? _d : (_c = addresses[0]) == null ? void 0 : _c.address) != null ? _e : null;
  } catch {
    return null;
  }
}
async function getWalletStatusFromSdk(state, walletUuid) {
  var _a;
  try {
    const walletsApi = createCoboWalletsApi(state);
    const detail = (await withCoboRetry(() => walletsApi.getWallet(walletUuid))).data.result;
    return (_a = detail.status) != null ? _a : null;
  } catch {
    return null;
  }
}
function rememberPendingAgentWallet(state, walletUuid) {
  const prep = state.walletPreparation;
  prep.agentWallet.coboWalletId = walletUuid;
  touchPreparation(prep, state);
}
async function bootstrapViaSdkCreate(state) {
  var _a;
  const prep = state.walletPreparation;
  if (prep.agentWallet.coboWalletId) return;
  await ensureCawCredentials(state);
  const walletsApi = createCoboWalletsApi(state);
  const mainNodeId = (_a = process.env.AGENT_WALLET_MAIN_NODE_ID) == null ? void 0 : _a.trim();
  const createResp = await withCoboRetry(() => walletsApi.createWallet({
    wallet_type: "MPC",
    name: `YieldAgent-${Date.now()}`,
    group_type: "agent",
    ...mainNodeId ? { main_node_id: mainNodeId } : {}
  }));
  rememberPendingAgentWallet(state, createResp.data.result.uuid);
}
async function bootstrapViaCliOnboardStep(state) {
  var _a, _b;
  const prep = state.walletPreparation;
  const bootstrap = getBootstrapState(prep);
  const result = await runCawOnboardStep({
    agentName: "YieldAgent",
    sessionId: (_a = bootstrap.sessionId) != null ? _a : void 0
  });
  setBootstrapState(state, {
    sessionId: result.sessionId,
    walletStatus: result.walletStatus,
    phase: result.phase === "active" ? "active" : "bootstrapping",
    message: (_b = result.nextAction) != null ? _b : result.lastError
  });
  if (result.agentId) state.settings.agentId = result.agentId;
  await syncCredentialsFromCli(state);
  if (result.walletUuid) {
    prep.agentWallet.coboWalletId = result.walletUuid;
    touchPreparation(prep, state);
  }
}
async function syncPreparationFromCawCli(state, runner = defaultCawRunner) {
  var _a;
  state.walletPreparation;
  await syncCredentialsFromCli(state, runner);
  const walletPayload = await runCawJson(["wallet", "current"], runner);
  if (Array.isArray(walletPayload)) throw new Error("CAW_CURRENT_WALLET_NOT_FOUND");
  const walletUuid = str(walletPayload.wallet_uuid);
  if (!walletUuid) throw new Error("CAW_CURRENT_WALLET_NOT_FOUND");
  const walletStatus = (_a = str(walletPayload.status)) != null ? _a : "active";
  const address = await resolveEvmAddressFromCli(state, walletUuid, runner);
  if (!address) throw new Error("CAW_ADDRESS_NOT_FOUND");
  setBootstrapState(state, {
    mode: "cli-onboard",
    phase: walletStatus === "active" ? "active" : "bootstrapping",
    walletStatus,
    message: "\u5DF2\u4ECE CAW CLI \u5BFC\u5165 onboard \u94B1\u5305"
  });
  let pairing;
  if (walletStatus === "active") {
    pairing = await resolvePairingStatus(state, walletUuid, runner);
  }
  return markAgentWalletCreated(state, {
    address,
    coboWalletId: walletUuid,
    pairing
  });
}
function buildStatusResponse(state, done) {
  const prep = state.walletPreparation;
  return {
    preparation: prep,
    bootstrap: getBootstrapState(prep),
    done: done != null ? done : isBootstrapDone(prep)
  };
}
async function startAgentBootstrap(state) {
  const prep = state.walletPreparation;
  if (prep.steps.eoa !== "completed") throw new Error("EOA_NOT_CONNECTED");
  const mode = await detectBootstrapMode();
  if (mode === "unavailable") throw new Error("TSS_NOT_CONFIGURED");
  const tss = await checkTssReadiness(state, prep.agentWallet.coboWalletId);
  setBootstrapState(state, {
    mode,
    phase: tss.online ? "bootstrapping" : "tss_check",
    tssOnline: tss.online,
    message: tss.message
  });
  if (!tss.online) {
    return buildStatusResponse(state, false);
  }
  if (mode === "cli-onboard") {
    await bootstrapViaCliOnboardStep(state);
  } else {
    await bootstrapViaSdkCreate(state);
    setBootstrapState(state, {
      phase: "bootstrapping",
      walletStatus: "preparing",
      message: "\u6B63\u5728\u901A\u8FC7 SDK \u521B\u5EFA MPC \u94B1\u5305\u5E76\u7B49\u5F85 vault \u5C31\u7EEA"
    });
  }
  return pollAgentBootstrap(state);
}
async function pollAgentBootstrap(state) {
  const prep = state.walletPreparation;
  const bootstrap = getBootstrapState(prep);
  if (isBootstrapDone(prep)) {
    setBootstrapState(state, { phase: "paired", message: "\u5DF2\u5B8C\u6210\u914D\u5BF9" });
    return buildStatusResponse(state, true);
  }
  if (prep.agentWallet.address && prep.agentWallet.coboWalletId) {
    return pollPairingForReadyWallet(state);
  }
  try {
    const tss = await checkTssReadiness(state, prep.agentWallet.coboWalletId);
    setBootstrapState(state, { tssOnline: tss.online, message: tss.message });
    if (!tss.online) {
      setBootstrapState(state, { phase: "tss_check" });
      return buildStatusResponse(state, false);
    }
    if (bootstrap.mode === "cli-onboard") {
      await bootstrapViaCliOnboardStep(state);
      await syncCredentialsFromCli(state);
      const walletUuid2 = prep.agentWallet.coboWalletId;
      const currentBootstrap = getBootstrapState(prep);
      if (!walletUuid2) {
        return buildStatusResponse(state, false);
      }
      const walletStatus2 = currentBootstrap.walletStatus;
      if (walletStatus2 !== "active" && currentBootstrap.phase !== "active") {
        setBootstrapState(state, {
          phase: "bootstrapping",
          message: "CAW onboard \u6B63\u5728\u8FDB\u884C\uFF0C\u7B49\u5F85 vault \u53D8\u4E3A active"
        });
        markAgentWalletPreparing(state, {
          coboWalletId: walletUuid2,
          pairing: { status: "unpaired", code: null, expiresAt: null }
        });
        return buildStatusResponse(state, false);
      }
      const address2 = await resolveEvmAddressFromCli(state, walletUuid2);
      if (!address2) {
        markAgentWalletPreparing(state, {
          coboWalletId: walletUuid2,
          pairing: { status: "unpaired", code: null, expiresAt: null }
        });
        setBootstrapState(state, { phase: "bootstrapping", message: "\u7B49\u5F85\u94FE\u4E0A\u5730\u5740\u751F\u6210" });
        return buildStatusResponse(state, false);
      }
      const pairing2 = await resolvePairingStatus(state, walletUuid2);
      if (pairing2.status === "paired") {
        setBootstrapState(state, { phase: "paired", message: "CAW App \u914D\u5BF9\u5DF2\u5B8C\u6210" });
      } else if (pairing2.status === "pairing") {
        setBootstrapState(state, { phase: "pairing", message: "\u8BF7\u5728 CAW App \u8F93\u5165\u914D\u5BF9\u7801" });
      } else {
        setBootstrapState(state, { phase: "active", message: "\u94B1\u5305\u5DF2 active\uFF0C\u53EF\u91CD\u65B0\u751F\u6210\u914D\u5BF9\u7801" });
      }
      markAgentWalletCreated(state, { address: address2, coboWalletId: walletUuid2, pairing: pairing2 });
      return buildStatusResponse(state, pairing2.status === "paired");
    }
    await ensureCawCredentials(state);
    const walletUuid = prep.agentWallet.coboWalletId;
    if (!walletUuid) {
      await bootstrapViaSdkCreate(state);
      return buildStatusResponse(state, false);
    }
    const walletStatus = await getWalletStatusFromSdk(state, walletUuid);
    setBootstrapState(state, { walletStatus });
    if (walletStatus !== "active") {
      if (walletStatus === "archived") throw new Error("WALLET_ARCHIVED");
      const tssCheck = await checkTssReadiness(state, walletUuid);
      if (!tssCheck.online) throw new Error("TSS_NODE_OFFLINE");
      markAgentWalletPreparing(state, {
        coboWalletId: walletUuid,
        pairing: { status: "unpaired", code: null, expiresAt: null }
      });
      setBootstrapState(state, {
        phase: "bootstrapping",
        message: "SDK \u94B1\u5305\u4ECD\u5728 preparing\uFF0C\u7B49\u5F85 vault \u521D\u59CB\u5316"
      });
      return buildStatusResponse(state, false);
    }
    const address = await resolveEvmAddressFromSdk(state, walletUuid);
    if (!address) {
      markAgentWalletPreparing(state, {
        coboWalletId: walletUuid,
        pairing: { status: "unpaired", code: null, expiresAt: null }
      });
      setBootstrapState(state, { phase: "bootstrapping", message: "\u7B49\u5F85\u94FE\u4E0A\u5730\u5740\u751F\u6210" });
      return buildStatusResponse(state, false);
    }
    const pairing = await resolvePairingStatus(state, walletUuid);
    if (pairing.status === "paired") {
      setBootstrapState(state, { phase: "paired", message: "CAW App \u914D\u5BF9\u5DF2\u5B8C\u6210" });
    } else if (pairing.status === "pairing") {
      setBootstrapState(state, { phase: "pairing", message: "\u8BF7\u5728 CAW App \u8F93\u5165\u914D\u5BF9\u7801" });
    } else {
      setBootstrapState(state, { phase: "active", message: "\u94B1\u5305\u5DF2 active" });
    }
    markAgentWalletCreated(state, {
      address,
      coboWalletId: walletUuid,
      pairing
    });
    return buildStatusResponse(state, pairing.status === "paired");
  } catch (err) {
    if (isTransientCoboNetworkError(err) && prep.agentWallet.coboWalletId) {
      markAgentWalletPreparing(state, {
        coboWalletId: prep.agentWallet.coboWalletId,
        pairing: { status: "unpaired", code: null, expiresAt: null }
      });
      setBootstrapState(state, {
        phase: "bootstrapping",
        message: "\u7F51\u7EDC\u6CE2\u52A8\uFF0C\u7A0D\u540E\u5C06\u7EE7\u7EED\u521D\u59CB\u5316"
      });
      return buildStatusResponse(state, false);
    }
    throw err;
  }
}
async function regenerateAgentPairing(state) {
  var _a;
  const prep = state.walletPreparation;
  if (!prep.agentWallet.coboWalletId || !prep.agentWallet.address) {
    throw new Error("AGENT_WALLET_NOT_READY");
  }
  const walletStatus = prep.agentWallet.coboWalletId ? await getWalletStatusFromSdk(state, prep.agentWallet.coboWalletId) : null;
  if (walletStatus && walletStatus !== "active") {
    throw new Error("WALLET_STILL_PREPARING");
  }
  const mode = getBootstrapState(prep).mode;
  const pairing = mode === "cli-onboard" ? (_a = await initiateWalletPairingCli()) != null ? _a : await initiateWalletPairingApi(state, prep.agentWallet.coboWalletId) : await initiateWalletPairingApi(state, prep.agentWallet.coboWalletId);
  return markAgentWalletCreated(state, {
    address: prep.agentWallet.address,
    coboWalletId: prep.agentWallet.coboWalletId,
    pairing
  });
}

export { regenerateAgentPairing as a, startAgentBootstrap as b, detectBootstrapMode as d, pollAgentBootstrap as p, runCawJson as r, syncPreparationFromCawCli as s };
//# sourceMappingURL=caw-wallet-bootstrap.mjs.map
