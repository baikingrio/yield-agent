import { d as defineEventHandler, r as readBody, c as createError, s as setResponseStatus } from '../../nitro/nitro.mjs';
import { z } from 'zod';
import { p as persistCurrentState, g as getState } from '../../_/app-store.mjs';
import { b as buildYieldPactDraft, s as strategyWhitelist, c as submitYieldPactToCobo } from '../../_/cobo-pact.mjs';
import { v as validateStrategyPayload } from '../../_/strategy-validator.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:module';
import '../../_/cobo-client.mjs';
import '@cobo/agentic-wallet';
import '../../_/cobo-config.mjs';
import '../../_/caw-wallet-bootstrap.mjs';
import 'node:child_process';
import 'node:fs/promises';
import 'node:util';
import '../../_/caw-onboard.mjs';
import '../../_/caw-provision.mjs';
import '../../_/pact-credentials.mjs';
import '../../_/app.mjs';
import '../../_/numeric-field.mjs';

const RISK_NAMES = {
  conservative: "\u4FDD\u5B88\u578B\u6536\u76CA",
  balanced: "\u5E73\u8861\u578B\u6536\u76CA",
  aggressive: "\u6FC0\u8FDB\u578B\u6536\u76CA"
};
const schema = z.object({
  network: z.enum(["base-sepolia", "arbitrum-sepolia"]),
  asset: z.string().min(1),
  targetApy: z.string().optional(),
  riskLevel: z.string().min(1),
  maxSpend: z.string().min(1),
  agentFee: z.string().min(1),
  userSplit: z.string().min(1)
});
const index_post = defineEventHandler(async (event) => {
  var _a;
  const body = await readBody(event);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      data: { error: "\u8BF7\u6C42\u53C2\u6570\u65E0\u6548", code: "VALIDATION_ERROR" }
    });
  }
  const state = getState();
  const data = parsed.data;
  if (!state.walletPreparation.ready) {
    throw createError({
      statusCode: 400,
      data: { error: "\u8BF7\u5148\u5B8C\u6210\u8D44\u91D1\u51C6\u5907" }
    });
  }
  const validation = validateStrategyPayload(state, data);
  if (!validation.valid) {
    const first = Object.values(validation.errors)[0] || "\u8BF7\u6C42\u53C2\u6570\u65E0\u6548";
    throw createError({
      statusCode: 400,
      data: { error: first, code: "VALIDATION_ERROR" }
    });
  }
  const maxSpend = Number(data.maxSpend);
  const agentFee = Number(data.agentFee);
  const userSplit = Number(data.userSplit);
  const ts = Date.now();
  const strategyId = `str-${ts}`;
  const pactId = `pact-${ts}`;
  const riskLabel = (_a = RISK_NAMES[data.riskLevel]) != null ? _a : data.riskLevel;
  const draft = buildYieldPactDraft(data);
  const whitelist = strategyWhitelist(data.riskLevel, data.network);
  let submitResult;
  try {
    submitResult = await submitYieldPactToCobo(state, data, pactId);
  } catch (err) {
    throw createError({
      statusCode: 502,
      data: { error: err instanceof Error ? err.message : "Cobo Pact \u63D0\u4EA4\u5931\u8D25" }
    });
  }
  const strategy = {
    id: strategyId,
    name: `${riskLabel} \xB7 ${data.asset}`,
    network: data.network,
    asset: data.asset,
    riskLevel: data.riskLevel,
    maxSpend,
    status: "active",
    pactId: submitResult.pactId,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  const pact = {
    id: submitResult.pactId,
    strategyId,
    intent: draft.intent,
    status: submitResult.status,
    maxSpend,
    whitelist,
    durationDays: 7,
    agentFeePercent: agentFee,
    userSplitPercent: userSplit,
    submissionMode: submitResult.mode,
    coboPactId: submitResult.mode === "cobo" ? submitResult.pactId : void 0,
    approvalId: submitResult.approvalId,
    coboStatus: submitResult.coboStatus,
    submissionMessage: submitResult.message,
    executionCredentialStored: submitResult.status === "active",
    firstExecutionCompleted: false
  };
  state.strategies.push(strategy);
  state.pacts.push(pact);
  state.logs.unshift({
    id: `log-${ts}`,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    action: submitResult.mode === "cobo" ? "Pact \u5DF2\u63D0\u4EA4\u5230 Cobo\uFF0C\u7B49\u5F85 App \u5BA1\u6279" : "Pact draft \u5DF2\u521B\u5EFA\uFF08\u672C\u5730\u964D\u7EA7\u6A21\u5F0F\uFF09",
    type: "pact",
    txHash: "",
    status: submitResult.status === "active" ? "\u5DF2\u6FC0\u6D3B" : "\u5F85\u5BA1\u6279",
    pactId: pact.id
  });
  persistCurrentState();
  setResponseStatus(event, 201);
  return { strategy, pact };
});

export { index_post as default };
//# sourceMappingURL=index.post.mjs.map
