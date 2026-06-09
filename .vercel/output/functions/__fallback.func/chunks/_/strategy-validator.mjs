import { M as MIN_MAX_SPEND_USDC, a as MAX_MAX_SPEND_USDC } from './app.mjs';
import { p as parseNumericField, n as normalizeNumericField } from './numeric-field.mjs';

function validateStrategyPayload(state, data, options) {
  var _a, _b;
  const errors = {};
  const spend = parseNumericField(data.maxSpend);
  const fee = parseNumericField(data.agentFee);
  const user = parseNumericField(data.userSplit);
  const spendRangeMessage = `\u8BF7\u8F93\u5165 ${MIN_MAX_SPEND_USDC}\u2013${MAX_MAX_SPEND_USDC.toLocaleString("en-US")} USDC`;
  if (state.walletPreparation.ready && data.network !== state.walletPreparation.network) {
    errors.network = `\u5FC5\u987B\u4E0E Agent Wallet \u6CE8\u8D44\u7F51\u7EDC\u4E00\u81F4\uFF08${state.walletPreparation.network}\uFF09`;
  }
  if (spend === null || spend < MIN_MAX_SPEND_USDC || spend > MAX_MAX_SPEND_USDC) {
    errors.maxSpend = spendRangeMessage;
  } else {
    const available = (_a = options == null ? void 0 : options.availableUsdc) != null ? _a : state.walletPreparation.ready ? state.walletPreparation.funding.availableUsdc : void 0;
    if (available !== void 0 && spend > available) {
      errors.maxSpend = `\u4E0D\u80FD\u8D85\u8FC7 Agent Wallet \u53EF\u7528\u4F59\u989D\uFF08${available} USDC\uFF09`;
    }
  }
  if (fee === null || fee < 0 || fee > 30) {
    errors.agentFee = "\u8BF7\u8F93\u5165 0\u201330%";
  }
  if (user === null || user < 0 || user > 100) {
    errors.userSplit = "\u8BF7\u8F93\u5165 0\u2013100%";
  }
  if ((_b = data.targetApy) == null ? void 0 : _b.trim()) {
    const apy = parseNumericField(data.targetApy);
    if (apy === null || apy < 0 || apy > 100) {
      errors.targetApy = "\u8BF7\u8F93\u5165 0\u2013100\uFF0C\u6216\u7559\u7A7A";
    }
  }
  return { valid: Object.keys(errors).length === 0, errors };
}
function normalizeStrategyProposal(proposal, fallbackNetwork) {
  var _a, _b, _c;
  proposal.network === "arbitrum-sepolia" ? "arbitrum-sepolia" : "base-sepolia";
  const asset = ((_a = proposal.asset) == null ? void 0 : _a.trim()) || "USDC";
  const riskLevel = ["conservative", "balanced", "aggressive"].includes(String(proposal.riskLevel)) ? String(proposal.riskLevel) : "conservative";
  const maxSpend = (_b = proposal.maxSpend) == null ? void 0 : _b.trim();
  if (!maxSpend) return null;
  return {
    network: proposal.network === "base-sepolia" || proposal.network === "arbitrum-sepolia" ? proposal.network : fallbackNetwork,
    asset,
    targetApy: ((_c = proposal.targetApy) == null ? void 0 : _c.trim()) || void 0,
    riskLevel,
    maxSpend: normalizeNumericField(maxSpend, maxSpend),
    agentFee: normalizeNumericField(proposal.agentFee, "15"),
    userSplit: normalizeNumericField(proposal.userSplit, "85")
  };
}

export { normalizeStrategyProposal as n, validateStrategyPayload as v };
//# sourceMappingURL=strategy-validator.mjs.map
