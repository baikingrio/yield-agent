import type { AppState, WithdrawInfo, WithdrawResult } from '../../shared/types/app'
import { assertAgentWalletHasGas, getAgentNativeEthBalance, resolveContractCallSponsor } from './agent-gas'
import {
  createCoboTransactionRecordsApi,
  createCoboTransactionsApi,
  extractCoboErrorMessage,
  isCoboConfigured,
  withCoboRetry,
} from './cobo-client'
import { getNetworkChainConfig } from './cobo-config'
import { submitTransferAndWait } from './cobo-transaction'
import { fetchUsdcBalanceFromCobo, syncWalletSummaryFromCobo } from './cobo-preparation'
import { verifyUsdcDeposit } from './deposit-verify'
import { applyDepositToState, touchPreparation } from './wallet-preparation'
import { readYieldSuppliedAmount } from './yield-position'

export const MIN_WALLET_OP_USDC = 10
export const MAX_WALLET_OP_USDC = 10_000

function assertAmountRange(amountUsdc: number): void {
  if (Number.isNaN(amountUsdc) || amountUsdc < MIN_WALLET_OP_USDC || amountUsdc > MAX_WALLET_OP_USDC) {
    throw new Error(`请输入 ${MIN_WALLET_OP_USDC}–${MAX_WALLET_OP_USDC.toLocaleString('en-US')} USDC`)
  }
}

function assertAgentWalletReady(state: AppState): void {
  const prep = state.walletPreparation
  if (prep.steps.agent_wallet !== 'completed' || !prep.agentWallet.created || !prep.agentWallet.coboWalletId) {
    throw new Error('请先创建 Agent Wallet')
  }
  if (!prep.agentWallet.address) {
    throw new Error('AGENT_WALLET_NOT_READY')
  }
  if (!prep.eoa.address) {
    throw new Error('EOA_NOT_CONNECTED')
  }
  if (!isCoboConfigured(state)) {
    throw new Error('请先在设置中配置 Cobo API Key')
  }
}

function mapDepositError(err: unknown): never {
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

export async function topUpUsdcDeposit(
  state: AppState,
  amountUsdc: number,
  txHash: string,
) {
  assertAmountRange(amountUsdc)
  assertAgentWalletReady(state)

  const prep = state.walletPreparation
  const wasReady = prep.funding.status === 'ready'

  if (!wasReady) {
    prep.steps.funding = 'in_progress'
    prep.funding.status = 'processing'
    touchPreparation(prep, state)
  }

  try {
    await verifyUsdcDeposit({
      txHash,
      network: prep.network,
      agentAddress: prep.agentWallet.address,
      eoaAddress: prep.eoa.address!,
      minAmountUsdc: amountUsdc,
    })

    const balance = await fetchUsdcBalanceFromCobo(state)
    const deposited = balance > 0 ? balance : amountUsdc

    return applyDepositToState(state, deposited, txHash)
  } catch (err) {
    if (!wasReady) {
      prep.steps.funding = 'pending'
      prep.funding.status = 'idle'
      touchPreparation(prep, state)
    }
    mapDepositError(err)
  }
}

export async function getWithdrawInfo(state: AppState): Promise<WithdrawInfo> {
  assertAgentWalletReady(state)

  const prep = state.walletPreparation
  const chainConfig = getNetworkChainConfig(prep.network)
  const liquidUsdc = await fetchUsdcBalanceFromCobo(state)
  const suppliedRaw = await readYieldSuppliedAmount(
    prep.network,
    chainConfig,
    prep.agentWallet.address as `0x${string}`,
  )
  const suppliedUsdc = Number(suppliedRaw) / 10 ** chainConfig.usdcDecimals

  return {
    eoaAddress: prep.eoa.address!,
    agentAddress: prep.agentWallet.address,
    network: prep.network,
    coboChainId: chainConfig.coboChainId,
    coboTokenId: chainConfig.coboTokenId,
    liquidUsdc,
    suppliedUsdc: Number.isFinite(suppliedUsdc) ? suppliedUsdc : 0,
    maxWithdrawUsdc: liquidUsdc,
    minAmount: MIN_WALLET_OP_USDC,
    maxAmount: MAX_WALLET_OP_USDC,
  }
}

export async function withdrawUsdcToEoa(
  state: AppState,
  amountUsdc: number,
): Promise<WithdrawResult> {
  assertAmountRange(amountUsdc)
  assertAgentWalletReady(state)

  const prep = state.walletPreparation
  const info = await getWithdrawInfo(state)

  if (amountUsdc > info.liquidUsdc) {
    throw new Error(`可提余额不足（当前 ${info.liquidUsdc.toLocaleString('zh-CN')} USDC）`)
  }

  await assertAgentWalletHasGas(prep.network, prep.agentWallet.address)

  const walletId = prep.agentWallet.coboWalletId!
  const chainConfig = getNetworkChainConfig(prep.network)
  const transactionsApi = createCoboTransactionsApi(state)
  const recordsApi = createCoboTransactionRecordsApi(state)
  const ethBalance = await getAgentNativeEthBalance(prep.network, prep.agentWallet.address as `0x${string}`)
  const sponsor = resolveContractCallSponsor(ethBalance)
  const requestId = `yieldagent-withdraw-${walletId}-${Date.now()}`

  try {
    const tx = await withCoboRetry(() => submitTransferAndWait(
      transactionsApi,
      recordsApi,
      walletId,
      {
        chainId: chainConfig.coboChainId,
        srcAddr: prep.agentWallet.address,
        dstAddr: prep.eoa.address!,
        tokenId: chainConfig.coboTokenId,
        amount: String(amountUsdc),
        requestId,
        sponsor,
        description: `YieldAgent withdraw ${amountUsdc} USDC to EOA`,
        stepLabel: 'USDC 提取',
      },
    ))

    await syncWalletSummaryFromCobo(state)

    const txHash = tx.transaction_hash ?? tx.data?.transaction_hash ?? null
    const liquidUsdc = await fetchUsdcBalanceFromCobo(state)

    state.logs.unshift({
      id: `log-withdraw-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: `Agent Wallet → EOA 提取 ${amountUsdc} USDC`,
      type: 'withdraw',
      txHash: txHash ?? '',
      status: '成功',
    })

    return {
      txHash,
      amountUsdc,
      status: tx.status_display ?? 'Success',
      liquidUsdc,
    }
  } catch (err) {
    const msg = extractCoboErrorMessage(err)
    throw new Error(msg)
  }
}
