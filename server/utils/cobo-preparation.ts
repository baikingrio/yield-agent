import { createPublicClient, erc20Abi, http } from 'viem'
import type { AppState, NetworkId, WalletPreparation } from '../../shared/types/app'
import { getNetworkChainConfig } from './cobo-config'
import { APP_CHAIN } from './chain'
import {
  createCoboBalanceApi,
  extractCoboErrorMessage,
  withCoboRetry,
} from './cobo-client'
import {
  pollAgentBootstrap,
  regenerateAgentPairing,
  startAgentBootstrap,
  syncPreparationFromCawCli,
} from './caw-wallet-bootstrap'
import { verifyUsdcDeposit } from './deposit-verify'
import {
  applyDepositToState,
  touchPreparation,
} from './wallet-preparation'

export async function createCoboAgentWallet(state: AppState): Promise<WalletPreparation> {
  const prep = state.walletPreparation
  if (prep.steps.eoa !== 'completed') {
    throw new Error('EOA_NOT_CONNECTED')
  }

  if (prep.agentWallet.created && prep.agentWallet.coboWalletId && prep.agentWallet.address) {
    if (prep.agentWallet.pairing?.status === 'paired') return prep
    return regenerateAgentPairing(state)
  }

  if (prep.agentWallet.coboWalletId || prep.steps.agent_wallet === 'in_progress') {
    const result = await pollAgentBootstrap(state)
    return result.preparation
  }

  const result = await startAgentBootstrap(state)
  return result.preparation
}

export async function importCoboAgentWalletFromCli(state: AppState): Promise<WalletPreparation> {
  if (state.walletPreparation.steps.eoa !== 'completed') {
    throw new Error('EOA_NOT_CONNECTED')
  }
  return syncPreparationFromCawCli(state)
}

export async function pollCoboAgentWalletStatus(state: AppState) {
  return pollAgentBootstrap(state)
}

interface CoboBalanceRow {
  token_id?: string
  symbol?: string
  amount?: string
}

function pickUsdcAmount(
  balances: CoboBalanceRow[],
  preferredTokenId: string,
): number {
  const usdc = balances.find((b) =>
    b.token_id === preferredTokenId
    || b.token_id?.toUpperCase().includes('USDC')
    || b.symbol?.toUpperCase() === 'USDC',
  )
  if (!usdc?.amount) return 0
  const parsed = Number.parseFloat(usdc.amount)
  return Number.isFinite(parsed) ? parsed : 0
}

async function fetchUsdcBalanceFromCoboApi(
  state: AppState,
  network: NetworkId,
  walletId: string,
  address: string,
): Promise<number> {
  const networkConfig = getNetworkChainConfig(network)
  const balanceApi = createCoboBalanceApi(state)
  const query = async (tokenId?: string) => {
    const resp = await withCoboRetry(() => balanceApi.listBalances(
      walletId,
      networkConfig.coboChainId,
      address,
      tokenId,
      true,
      50,
    ))
    return pickUsdcAmount(resp.data.result ?? [], networkConfig.coboTokenId)
  }

  try {
    const withToken = await query(networkConfig.coboTokenId)
    if (withToken > 0) return withToken
  } catch {
    // Fall through to unfiltered query.
  }

  try {
    return await query(undefined)
  } catch {
    return 0
  }
}

export async function fetchUsdcBalanceOnChain(
  network: NetworkId,
  address: string,
): Promise<number> {
  const chainConfig = getNetworkChainConfig(network)
  const client = createPublicClient({ chain: APP_CHAIN, transport: http() })

  try {
    const raw = await client.readContract({
      address: chainConfig.usdcContract,
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [address as `0x${string}`],
    })
    const parsed = Number(raw) / 10 ** chainConfig.usdcDecimals
    return Number.isFinite(parsed) ? parsed : 0
  } catch {
    return 0
  }
}

export async function fetchUsdcBalanceFromCobo(
  state: AppState,
  network?: NetworkId,
): Promise<number> {
  const prep = state.walletPreparation
  const walletId = prep.agentWallet.coboWalletId
  if (!walletId || !prep.agentWallet.created || !prep.agentWallet.address) return 0

  const net = network ?? prep.network
  try {
    const coboBalance = await fetchUsdcBalanceFromCoboApi(
      state,
      net,
      walletId,
      prep.agentWallet.address,
    )
    if (coboBalance > 0) return coboBalance
  } catch {
    // If the Cobo SDK is unavailable/not configured, keep the demo usable by
    // falling back to an on-chain balance read instead of failing the route.
  }

  return fetchUsdcBalanceOnChain(net, prep.agentWallet.address)
}

export async function syncFundingFromExistingBalance(state: AppState): Promise<WalletPreparation> {
  touchPreparation(state.walletPreparation, state)
  const prep = state.walletPreparation

  if (!prep.agentWallet.coboWalletId?.trim() || !prep.agentWallet.address?.trim()) {
    return prep
  }

  let balance = 0
  try {
    balance = await fetchUsdcBalanceFromCobo(state)
  } catch {
    return prep
  }

  if (prep.funding.status === 'ready') {
    if (balance > 0) {
      prep.funding.availableUsdc = balance
      prep.funding.depositedUsdc = Math.max(prep.funding.depositedUsdc, balance)
      state.wallet.totalAssetsUsdc = balance
      touchPreparation(prep, state)
    }
    return prep
  }

  if (balance <= 0) {
    return prep
  }

  if (prep.steps.agent_wallet !== 'completed') {
    prep.agentWallet.created = true
    prep.steps.agent_wallet = 'completed'
    if (prep.agentWallet.pairing?.status !== 'paired') {
      prep.agentWallet.pairing = {
        status: 'paired',
        code: null,
        expiresAt: null,
      }
    }
  }

  return applyDepositToState(state, balance, null)
}

export async function syncWalletSummaryFromCobo(state: AppState): Promise<void> {
  const prep = state.walletPreparation
  if (!prep.agentWallet.coboWalletId) return

  const balance = await fetchUsdcBalanceFromCobo(state)
  state.wallet.address = prep.agentWallet.address
  state.wallet.totalAssetsUsdc = balance
  if (prep.funding.status === 'ready') {
    prep.funding.availableUsdc = balance
  }
}

export async function confirmUsdcDeposit(
  state: AppState,
  amountUsdc: number,
  txHash: string,
): Promise<WalletPreparation> {
  const prep = state.walletPreparation
  if (prep.steps.agent_wallet !== 'completed') {
    throw new Error('AGENT_WALLET_NOT_READY')
  }
  if (!prep.eoa.address) {
    throw new Error('EOA_NOT_CONNECTED')
  }

  prep.steps.funding = 'in_progress'
  prep.funding.status = 'processing'
  touchPreparation(prep, state)

  try {
    await verifyUsdcDeposit({
      txHash,
      network: prep.network,
      agentAddress: prep.agentWallet.address,
      eoaAddress: prep.eoa.address,
      minAmountUsdc: amountUsdc,
    })

    const balance = await fetchUsdcBalanceFromCobo(state)
    const deposited = balance > 0 ? balance : amountUsdc

    return applyDepositToState(state, deposited, txHash)
  } catch (err) {
    prep.steps.funding = 'pending'
    prep.funding.status = 'idle'
    touchPreparation(prep, state)

    if (err instanceof Error) {
      switch (err.message) {
        case 'TX_FAILED':
          throw new Error('链上交易失败，请重试')
        case 'TRANSFER_NOT_FOUND':
          throw new Error('未找到匹配的 USDC 转账，请确认金额、收款地址与网络')
        default:
          throw err
      }
    }
    throw new Error('转入确认失败，请重试')
  }
}
