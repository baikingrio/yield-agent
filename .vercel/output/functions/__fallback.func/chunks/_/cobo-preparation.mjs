import { createPublicClient, http, parseEventLogs, erc20Abi } from 'viem';
import { baseSepolia, arbitrumSepolia } from 'viem/chains';
import { b as getNetworkChainConfig } from './cobo-config.mjs';
import { b as createCoboBalanceApi, w as withCoboRetry } from './cobo-client.mjs';
import { p as pollAgentBootstrap, a as regenerateAgentPairing, b as startAgentBootstrap, s as syncPreparationFromCawCli } from './caw-wallet-bootstrap.mjs';
import { h as applyDepositToState, t as touchPreparation } from './app-store.mjs';

async function verifyUsdcDeposit(params) {
  const chainConfig = getNetworkChainConfig(params.network);
  const chain = params.network === "base-sepolia" ? baseSepolia : arbitrumSepolia;
  const client = createPublicClient({ chain, transport: http() });
  const receipt = await client.waitForTransactionReceipt({
    hash: params.txHash,
    timeout: 12e4
  });
  if (receipt.status !== "success") {
    throw new Error("TX_FAILED");
  }
  const minUnits = BigInt(Math.round(params.minAmountUsdc * 10 ** chainConfig.usdcDecimals));
  const agent = params.agentAddress.toLowerCase();
  const eoa = params.eoaAddress.toLowerCase();
  const contract = chainConfig.usdcContract.toLowerCase();
  const transfers = parseEventLogs({
    abi: erc20Abi,
    eventName: "Transfer",
    logs: receipt.logs
  });
  const matched = transfers.some((log) => {
    if (log.address.toLowerCase() !== contract) return false;
    const { from, to, value } = log.args;
    return (to == null ? void 0 : to.toLowerCase()) === agent && (from == null ? void 0 : from.toLowerCase()) === eoa && value !== void 0 && value >= minUnits;
  });
  if (!matched) {
    throw new Error("TRANSFER_NOT_FOUND");
  }
}

async function createCoboAgentWallet(state) {
  var _a;
  const prep = state.walletPreparation;
  if (prep.steps.eoa !== "completed") {
    throw new Error("EOA_NOT_CONNECTED");
  }
  if (prep.agentWallet.created && prep.agentWallet.coboWalletId && prep.agentWallet.address) {
    if (((_a = prep.agentWallet.pairing) == null ? void 0 : _a.status) === "paired") return prep;
    return regenerateAgentPairing(state);
  }
  if (prep.agentWallet.coboWalletId || prep.steps.agent_wallet === "in_progress") {
    const result2 = await pollAgentBootstrap(state);
    return result2.preparation;
  }
  const result = await startAgentBootstrap(state);
  return result.preparation;
}
async function importCoboAgentWalletFromCli(state) {
  if (state.walletPreparation.steps.eoa !== "completed") {
    throw new Error("EOA_NOT_CONNECTED");
  }
  return syncPreparationFromCawCli(state);
}
async function pollCoboAgentWalletStatus(state) {
  return pollAgentBootstrap(state);
}
function pickUsdcAmount(balances, preferredTokenId) {
  const usdc = balances.find(
    (b) => {
      var _a, _b;
      return b.token_id === preferredTokenId || ((_a = b.token_id) == null ? void 0 : _a.toUpperCase().includes("USDC")) || ((_b = b.symbol) == null ? void 0 : _b.toUpperCase()) === "USDC";
    }
  );
  if (!(usdc == null ? void 0 : usdc.amount)) return 0;
  const parsed = Number.parseFloat(usdc.amount);
  return Number.isFinite(parsed) ? parsed : 0;
}
async function fetchUsdcBalanceFromCoboApi(state, network, walletId, address) {
  const networkConfig = getNetworkChainConfig(network);
  const balanceApi = createCoboBalanceApi(state);
  const query = async (tokenId) => {
    var _a;
    const resp = await withCoboRetry(() => balanceApi.listBalances(
      walletId,
      networkConfig.coboChainId,
      address,
      tokenId,
      true,
      50
    ));
    return pickUsdcAmount((_a = resp.data.result) != null ? _a : [], networkConfig.coboTokenId);
  };
  try {
    const withToken = await query(networkConfig.coboTokenId);
    if (withToken > 0) return withToken;
  } catch {
  }
  try {
    return await query(void 0);
  } catch {
    return 0;
  }
}
async function fetchUsdcBalanceOnChain(network, address) {
  const chainConfig = getNetworkChainConfig(network);
  const chain = network === "base-sepolia" ? baseSepolia : arbitrumSepolia;
  const client = createPublicClient({ chain, transport: http() });
  try {
    const raw = await client.readContract({
      address: chainConfig.usdcContract,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [address]
    });
    const parsed = Number(raw) / 10 ** chainConfig.usdcDecimals;
    return Number.isFinite(parsed) ? parsed : 0;
  } catch {
    return 0;
  }
}
async function fetchUsdcBalanceFromCobo(state, network) {
  const prep = state.walletPreparation;
  const walletId = prep.agentWallet.coboWalletId;
  if (!walletId || !prep.agentWallet.created || !prep.agentWallet.address) return 0;
  const net = prep.network;
  try {
    const coboBalance = await fetchUsdcBalanceFromCoboApi(
      state,
      net,
      walletId,
      prep.agentWallet.address
    );
    if (coboBalance > 0) return coboBalance;
  } catch {
  }
  return fetchUsdcBalanceOnChain(net, prep.agentWallet.address);
}
async function syncFundingFromExistingBalance(state) {
  const prep = state.walletPreparation;
  if (prep.steps.agent_wallet !== "completed" || !prep.agentWallet.created) {
    return prep;
  }
  if (prep.funding.status === "ready") {
    return prep;
  }
  const balance = await fetchUsdcBalanceFromCobo(state);
  if (balance <= 0) {
    return prep;
  }
  return applyDepositToState(state, balance, null);
}
async function syncWalletSummaryFromCobo(state) {
  const prep = state.walletPreparation;
  if (!prep.agentWallet.coboWalletId) return;
  const balance = await fetchUsdcBalanceFromCobo(state);
  state.wallet.address = prep.agentWallet.address;
  state.wallet.totalAssetsUsdc = balance;
  if (prep.funding.status === "ready") {
    prep.funding.availableUsdc = balance;
  }
}
async function confirmUsdcDeposit(state, amountUsdc, txHash) {
  const prep = state.walletPreparation;
  if (prep.steps.agent_wallet !== "completed") {
    throw new Error("AGENT_WALLET_NOT_READY");
  }
  if (!prep.eoa.address) {
    throw new Error("EOA_NOT_CONNECTED");
  }
  prep.steps.funding = "in_progress";
  prep.funding.status = "processing";
  touchPreparation(prep, state);
  try {
    await verifyUsdcDeposit({
      txHash,
      network: prep.network,
      agentAddress: prep.agentWallet.address,
      eoaAddress: prep.eoa.address,
      minAmountUsdc: amountUsdc
    });
    const balance = await fetchUsdcBalanceFromCobo(state);
    const deposited = balance > 0 ? balance : amountUsdc;
    return applyDepositToState(state, deposited, txHash);
  } catch (err) {
    prep.steps.funding = "pending";
    prep.funding.status = "idle";
    touchPreparation(prep, state);
    if (err instanceof Error) {
      switch (err.message) {
        case "TX_FAILED":
          throw new Error("\u94FE\u4E0A\u4EA4\u6613\u5931\u8D25\uFF0C\u8BF7\u91CD\u8BD5");
        case "TRANSFER_NOT_FOUND":
          throw new Error("\u672A\u627E\u5230\u5339\u914D\u7684 USDC \u8F6C\u8D26\uFF0C\u8BF7\u786E\u8BA4\u91D1\u989D\u3001\u6536\u6B3E\u5730\u5740\u4E0E\u7F51\u7EDC");
        default:
          throw err;
      }
    }
    throw new Error("\u8F6C\u5165\u786E\u8BA4\u5931\u8D25\uFF0C\u8BF7\u91CD\u8BD5");
  }
}

export { syncFundingFromExistingBalance as a, confirmUsdcDeposit as b, createCoboAgentWallet as c, importCoboAgentWalletFromCli as i, pollCoboAgentWalletStatus as p, syncWalletSummaryFromCobo as s };
//# sourceMappingURL=cobo-preparation.mjs.map
