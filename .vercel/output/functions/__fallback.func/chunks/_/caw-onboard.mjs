import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
async function defaultRunner(args) {
  var _a;
  const { stdout, stderr } = await execFileAsync("caw", args, {
    timeout: 12e4,
    maxBuffer: 1024 * 1024,
    env: {
      ...process.env,
      PATH: `/usr/local/bin:${(_a = process.env.PATH) != null ? _a : ""}`
    }
  });
  return { stdout, stderr };
}
function parseJson(stdout) {
  const parsed = JSON.parse(stdout || "{}");
  return parsed && typeof parsed === "object" ? parsed : {};
}
function str(value) {
  return typeof value === "string" && value.trim() ? value : null;
}
function bool(value) {
  return value === true;
}
function prompts(value) {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    var _a, _b, _c;
    if (!item || typeof item !== "object") return [];
    const obj = item;
    const id = str(obj.id);
    if (!id) return [];
    return [{
      id,
      label: (_a = str(obj.label)) != null ? _a : void 0,
      type: (_b = str(obj.type)) != null ? _b : void 0,
      required: obj.required === true,
      secret: obj.secret === true || id.toLowerCase().includes("key"),
      description: (_c = str(obj.description)) != null ? _c : void 0
    }];
  });
}
function phaseFrom(payload, walletStatus) {
  if (walletStatus === "active" || payload.phase === "wallet_active") return "active";
  if (payload.phase === "error") return "error";
  if (payload.needs_input === true || prompts(payload.prompts).length > 0) return "needs_input";
  if (payload.phase) return "running";
  return "unknown";
}
function statusFrom(statusPayload, walletPayload, onboardPayload) {
  var _a;
  const walletStatus = (_a = str(statusPayload.wallet_status)) != null ? _a : str(walletPayload == null ? void 0 : walletPayload.status);
  const phase = phaseFrom(onboardPayload != null ? onboardPayload : {}, walletStatus);
  return {
    healthy: bool(statusPayload.healthy),
    walletStatus,
    walletPaired: bool(statusPayload.wallet_paired),
    agentId: str(walletPayload == null ? void 0 : walletPayload.agent_id),
    agentName: str(walletPayload == null ? void 0 : walletPayload.agent_name),
    walletUuid: str(walletPayload == null ? void 0 : walletPayload.wallet_uuid),
    walletName: str(walletPayload == null ? void 0 : walletPayload.wallet_name),
    apiUrl: str(walletPayload == null ? void 0 : walletPayload.api_url),
    phase,
    sessionId: str(onboardPayload == null ? void 0 : onboardPayload.session_id),
    needsInput: bool(onboardPayload == null ? void 0 : onboardPayload.needs_input) || phase === "needs_input",
    prompts: prompts(onboardPayload == null ? void 0 : onboardPayload.prompts),
    nextAction: str(onboardPayload == null ? void 0 : onboardPayload.next_action),
    lastError: str(onboardPayload == null ? void 0 : onboardPayload.last_error)
  };
}
async function runJson(args, options) {
  var _a;
  const runner = (_a = options.runner) != null ? _a : defaultRunner;
  try {
    const { stdout } = await runner(args);
    return parseJson(stdout);
  } catch (err) {
    if (err && typeof err === "object" && "stdout" in err && typeof err.stdout === "string") {
      return parseJson(err.stdout);
    }
    throw err;
  }
}
async function getCawOnboardStatus(options = {}) {
  const statusPayload = await runJson(["status"], options);
  let walletPayload = {};
  try {
    walletPayload = await runJson(["wallet", "current"], options);
  } catch {
    walletPayload = {};
  }
  return statusFrom(statusPayload, walletPayload);
}
async function runCawOnboardStep(args, options = {}) {
  var _a, _b;
  const cliArgs = ["onboard"];
  if ((_a = args.agentName) == null ? void 0 : _a.trim()) cliArgs.push("--agent-name", args.agentName.trim());
  if ((_b = args.sessionId) == null ? void 0 : _b.trim()) cliArgs.push("--session-id", args.sessionId.trim());
  if (args.answers && Object.keys(args.answers).length > 0) cliArgs.push("--answers", JSON.stringify(args.answers));
  if (args.wait) cliArgs.push("--wait");
  const onboardPayload = await runJson(cliArgs, options);
  const statusPayload = await runJson(["status"], options).catch(() => ({}));
  const walletPayload = await runJson(["wallet", "current"], options).catch(() => ({}));
  return {
    ...statusFrom(statusPayload, walletPayload, onboardPayload),
    rawPhase: str(onboardPayload.phase)
  };
}

export { getCawOnboardStatus as g, runCawOnboardStep as r };
//# sourceMappingURL=caw-onboard.mjs.map
