import { d as defineEventHandler } from '../../../nitro/nitro.mjs';
import { existsSync } from 'node:fs';
import { isAbsolute, delimiter, join } from 'node:path';
import { b as buildHermesStrategyReadinessEnv } from '../../../_/hermes-strategy-client.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:crypto';

function normalizeMode(value) {
  return (value == null ? void 0 : value.trim().toLowerCase()) === "api" ? "api" : "cli";
}
function commandExistsOnPath(command, env) {
  var _a, _b;
  if (!command) return false;
  if (isAbsolute(command) || command.includes("/")) return existsSync(command);
  const pathValue = (_b = (_a = env.PATH) != null ? _a : process.env.PATH) != null ? _b : "";
  return pathValue.split(delimiter).some((dir) => existsSync(join(dir, command)));
}
function buildStrategyAgentReadiness(options = {}) {
  var _a, _b, _c, _d, _e, _f;
  const env = (_a = options.env) != null ? _a : process.env;
  const mode = normalizeMode(env.HERMES_STRATEGY_MODE);
  const command = ((_b = env.HERMES_CLI_BIN) == null ? void 0 : _b.trim()) || "hermes";
  const endpoint = ((_c = env.HERMES_API_URL) == null ? void 0 : _c.trim()) || null;
  const profile = ((_d = env.HERMES_PROFILE) == null ? void 0 : _d.trim()) || "default";
  const model = ((_e = env.HERMES_STRATEGY_MODEL) == null ? void 0 : _e.trim()) || null;
  const exists = (_f = options.commandExists) != null ? _f : ((cmd) => commandExistsOnPath(cmd, env));
  const missing = [];
  if (mode === "api") {
    missing.push(...buildHermesStrategyReadinessEnv(env).missing);
  } else if (!exists(command)) {
    missing.push("Hermes CLI");
  }
  const configured = missing.length === 0;
  const remoteCallable = mode === "api" && configured;
  const deploymentReady = remoteCallable;
  const nextAction = configured ? deploymentReady ? "\u7B56\u7565\u5C42\u4F1A\u901A\u8FC7\u8FDC\u7A0B Hermes API \u8C03\u7528\u5F53\u524D Hermes Agent \u4E3B\u673A\uFF1BVercel \u90E8\u7F72\u53EF\u4F7F\u7528\u8BE5 endpoint\u3002" : "\u672C\u5730 CLI \u6A21\u5F0F\u53EA\u9002\u5408\u5728 Hermes Agent \u4E3B\u673A\u4E0A\u5F00\u53D1\uFF1BVercel \u90E8\u7F72\u9700\u5207\u6362 HERMES_STRATEGY_MODE=api\uFF0C\u5E76\u628A HERMES_API_URL \u914D\u6210\u53EF\u8FDC\u7A0B\u8BBF\u95EE\u7684 Hermes API/tunnel\u3002" : mode === "api" ? "\u914D\u7F6E HERMES_API_URL \u6307\u5411\u5F53\u524D Hermes Agent \u4E3B\u673A\u4E0A\u53EF\u8FDC\u7A0B\u8BBF\u95EE\u7684 Hermes API Server\u3002" : "\u5B89\u88C5\u6216\u914D\u7F6E HERMES_CLI_BIN \u4EC5\u80FD\u6EE1\u8DB3\u672C\u673A\u5F00\u53D1\uFF1B\u82E5\u524D\u7AEF\u90E8\u7F72\u5230 Vercel\uFF0C\u9700\u8981\u6539\u7528 Hermes API \u6A21\u5F0F\u3002";
  return {
    provider: "hermes",
    mode,
    localExecution: true,
    runtimeHost: "hermes-agent-host",
    remoteCallable,
    deploymentReady,
    configured,
    command: mode === "cli" ? command : null,
    endpoint: mode === "api" ? endpoint : null,
    profile,
    model,
    missing,
    nextAction
  };
}

const readiness_get = defineEventHandler(() => buildStrategyAgentReadiness());

export { readiness_get as default };
//# sourceMappingURL=readiness.get.mjs.map
