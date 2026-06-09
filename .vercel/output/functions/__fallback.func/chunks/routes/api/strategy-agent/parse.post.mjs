import { d as defineEventHandler, r as readBody, c as createError } from '../../../nitro/nitro.mjs';
import { z } from 'zod';
import { g as getState } from '../../../_/app-store.mjs';
import { n as normalizeNumericField } from '../../../_/numeric-field.mjs';
import { c as callHermesStrategyAgent } from '../../../_/hermes-strategy-client.mjs';
import { n as normalizeStrategyProposal, v as validateStrategyPayload } from '../../../_/strategy-validator.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:module';
import '../../../_/app.mjs';

const SYSTEM_PROMPT = `You are YieldAgent strategy parser. Reply with JSON only, no markdown.
Schema:
{
  "network": "base-sepolia" | "arbitrum-sepolia",
  "asset": "USDC",
  "targetApy": string optional,
  "riskLevel": "conservative" | "balanced" | "aggressive",
  "maxSpend": string,
  "agentFee": string,
  "userSplit": string,
  "explanation": string,
  "warnings": string[]
}

Rules:
- maxSpend is the TOTAL USDC cap for the entire Pact (not a daily limit).
- If the user gives a per-day amount and a duration (e.g. 1 USDC/day for one week), multiply them for maxSpend (e.g. 7).
- maxSpend must be between 1 and the provided availableUsdc.
- Buying/swapping into ETH or other assets implies riskLevel "aggressive" or "balanced", not conservative.`;
function extractJsonObject(text) {
  var _a;
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = ((_a = fenced == null ? void 0 : fenced[1]) == null ? void 0 : _a.trim()) || trimmed;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(candidate.slice(start, end + 1));
  } catch {
    return null;
  }
}
function parseDurationDays(text) {
  if (/一周|1\s*周|七天|7\s*天/.test(text)) return 7;
  const dayMatch = text.match(/(\d+)\s*天/);
  if (dayMatch == null ? void 0 : dayMatch[1]) return Number(dayMatch[1]);
  return null;
}
function inferMaxSpendFromText(text) {
  var _a, _b;
  const dailyMatch = text.match(/每[日天][^。，,]*?(\d+(?:\.\d+)?)\s*USDC/i) || text.match(/每[日天][^。，,]*?最多\s*(\d+(?:\.\d+)?)\s*USDC/i);
  if (dailyMatch == null ? void 0 : dailyMatch[1]) {
    const daily = Number(dailyMatch[1]);
    const days = (_a = parseDurationDays(text)) != null ? _a : 7;
    if (!Number.isNaN(daily) && daily > 0 && days > 0) {
      return String(daily * days);
    }
  }
  const amount = text.match(/(\d+(?:\.\d+)?)\s*usdc/i) || text.match(/(\d+(?:\.\d+)?)\s*(?:枚|个)?\s*usdc?/i);
  return (_b = amount == null ? void 0 : amount[1]) != null ? _b : null;
}
function fallbackRegexParse(text, limits) {
  const lower = text.toLowerCase();
  const proposal = {
    asset: "USDC",
    network: limits.network,
    riskLevel: "conservative",
    agentFee: "15",
    userSplit: "85"
  };
  if (lower.includes("aggressive") || lower.includes("\u6FC0\u8FDB")) proposal.riskLevel = "aggressive";
  else if (lower.includes("balanced") || lower.includes("\u5E73\u8861")) proposal.riskLevel = "balanced";
  else if (lower.includes("conservative") || lower.includes("\u4FDD\u5B88")) proposal.riskLevel = "conservative";
  else if (/买入\s*eth|买\s*eth|swap|兑换/i.test(text)) proposal.riskLevel = "aggressive";
  const maxSpend = inferMaxSpendFromText(text);
  if (maxSpend) proposal.maxSpend = maxSpend;
  const apy = text.match(/(\d+(?:\.\d+)?)\s*%?\s*apy/i) || text.match(/apy\s*(\d+)/i) || text.match(/目标\s*(\d+(?:\.\d+)?)\s*%/);
  if (apy == null ? void 0 : apy[1]) proposal.targetApy = apy[1];
  if (lower.includes("arbitrum") || lower.includes("\u4EF2\u88C1")) proposal.network = "arbitrum-sepolia";
  if (lower.includes("base") || lower.includes("\u57FA\u5730")) proposal.network = "base-sepolia";
  return normalizeStrategyProposal(proposal, limits.network);
}
function validationOptions(limits) {
  return { availableUsdc: limits.availableUsdc };
}
function firstValidationError(state, proposal, limits) {
  const validation = validateStrategyPayload(state, proposal, validationOptions(limits));
  if (validation.valid) return null;
  return Object.values(validation.errors)[0] || "\u53C2\u6570\u6821\u9A8C\u5931\u8D25";
}
async function parseStrategyNaturalLanguage(state, text, limits) {
  var _a, _b, _c, _d, _e, _f, _g;
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error("\u7B56\u7565\u63CF\u8FF0\u4E0D\u80FD\u4E3A\u7A7A");
  }
  const endpoint = (_a = process.env.HERMES_API_URL) == null ? void 0 : _a.trim();
  const apiKey = ((_b = process.env.HERMES_API_KEY) == null ? void 0 : _b.trim()) || ((_c = process.env.API_SERVER_KEY) == null ? void 0 : _c.trim());
  if (!endpoint || !apiKey) {
    const proposal2 = fallbackRegexParse(trimmed, limits);
    if (!proposal2) {
      const err = new Error("Hermes \u672A\u914D\u7F6E\uFF0C\u4E14\u65E0\u6CD5\u4ECE\u63CF\u8FF0\u4E2D\u63D0\u53D6\u6709\u6548\u53C2\u6570");
      err.fallbackAvailable = true;
      throw err;
    }
    const validationError2 = firstValidationError(state, proposal2, limits);
    if (validationError2) throw new Error(validationError2);
    return {
      proposal: proposal2,
      explanation: "\u5DF2\u4F7F\u7528\u672C\u5730\u89C4\u5219\u89E3\u6790\uFF08Hermes \u672A\u914D\u7F6E\uFF09\u3002",
      warnings: ["Hermes API \u672A\u914D\u7F6E\uFF0C\u5EFA\u8BAE\u914D\u7F6E\u540E\u83B7\u5F97\u66F4\u51C6\u786E\u7684\u7B56\u7565\u89E3\u6790\u3002"],
      fallbackAvailable: true
    };
  }
  let hermesError = null;
  let hermesProposal = null;
  let hermesExplanation = "\u5DF2\u6839\u636E\u81EA\u7136\u8BED\u8A00\u751F\u6210\u7B56\u7565\u63D0\u6848\u3002";
  let hermesWarnings = [];
  try {
    const result = await callHermesStrategyAgent({
      endpoint,
      apiKey,
      model: process.env.HERMES_STRATEGY_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Limits: network=${limits.network}, availableUsdc=${limits.availableUsdc}. Parse: ${trimmed}`
        }
      ]
    });
    const parsed = extractJsonObject(result.content);
    if (!parsed) throw new Error("Hermes \u8FD4\u56DE\u7684\u5185\u5BB9\u65E0\u6CD5\u89E3\u6790\u4E3A JSON");
    hermesProposal = normalizeStrategyProposal(
      {
        network: parsed.network,
        asset: String((_d = parsed.asset) != null ? _d : "USDC"),
        targetApy: parsed.targetApy ? String(parsed.targetApy) : void 0,
        riskLevel: String((_e = parsed.riskLevel) != null ? _e : "conservative"),
        maxSpend: normalizeNumericField(parsed.maxSpend, ""),
        agentFee: normalizeNumericField(parsed.agentFee, "15"),
        userSplit: normalizeNumericField(parsed.userSplit, "85")
      },
      limits.network
    );
    if (!hermesProposal) throw new Error("Hermes \u672A\u8FD4\u56DE\u6709\u6548\u7684 maxSpend");
    hermesExplanation = String((_f = parsed.explanation) != null ? _f : hermesExplanation);
    hermesWarnings = Array.isArray(parsed.warnings) ? parsed.warnings.map((item) => String(item)) : [];
  } catch (err) {
    hermesError = err instanceof Error ? err : new Error("Hermes \u7B56\u7565\u89E3\u6790\u5931\u8D25");
  }
  if (hermesProposal) {
    const validationError2 = firstValidationError(state, hermesProposal, limits);
    if (validationError2) throw new Error(validationError2);
    return {
      proposal: hermesProposal,
      explanation: hermesExplanation,
      warnings: hermesWarnings
    };
  }
  const proposal = fallbackRegexParse(trimmed, limits);
  if (!proposal) {
    const err = hermesError != null ? hermesError : new Error("\u65E0\u6CD5\u4ECE\u63CF\u8FF0\u4E2D\u63D0\u53D6\u6709\u6548\u53C2\u6570");
    err.fallbackAvailable = true;
    throw err;
  }
  const validationError = firstValidationError(state, proposal, limits);
  if (validationError) throw new Error(validationError);
  return {
    proposal,
    explanation: "Hermes \u8C03\u7528\u5931\u8D25\uFF0C\u5DF2\u56DE\u9000\u5230\u672C\u5730\u89C4\u5219\u89E3\u6790\u3002",
    warnings: [(_g = hermesError == null ? void 0 : hermesError.message) != null ? _g : "Hermes \u8C03\u7528\u5931\u8D25"],
    fallbackAvailable: true
  };
}

const schema = z.object({
  text: z.string().min(1),
  limits: z.object({
    availableUsdc: z.number().nonnegative(),
    network: z.enum(["base-sepolia", "arbitrum-sepolia"])
  })
});
const parse_post = defineEventHandler(async (event) => {
  const body = await readBody(event);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      data: { error: "\u8BF7\u6C42\u53C2\u6570\u65E0\u6548" }
    });
  }
  const state = getState();
  try {
    return await parseStrategyNaturalLanguage(state, parsed.data.text, parsed.data.limits);
  } catch (err) {
    const message = err instanceof Error ? err.message : "\u7B56\u7565\u89E3\u6790\u5931\u8D25";
    const fallbackAvailable = Boolean(
      err && typeof err === "object" && "fallbackAvailable" in err && err.fallbackAvailable
    );
    throw createError({
      statusCode: fallbackAvailable ? 503 : 400,
      data: { error: message, fallbackAvailable }
    });
  }
});

export { parse_post as default };
//# sourceMappingURL=parse.post.mjs.map
