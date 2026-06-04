import type { DemoState, NetworkId, WalletPreparation } from '../../shared/types/demo'
import { getNetworkChainConfig } from './cobo-config'
import {
  createCoboBalanceApi,
  createCoboWalletsApi,
  extractCoboErrorMessage,
} from './cobo-client'
import { verifyUsdcDeposit } from './deposit-verify'
import {
  applyDepositToState,
  markAgentWalletCreated,
  touchPreparation,
} from './wallet-preparation'

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function waitForWalletActive(
  walletsApi: ReturnType<typeof createCoboWalletsApi>,
  walletUuid: string,
  maxAttempts = 30,
): Promise<void> {
  for (let i = 0; i < maxAttempts; i += 1) {
    const detail = (await walletsApi.getWallet(walletUuid)).data.result
    if (detail.status === 'active') return
    if (detail.status === 'archived') {
      throw new Error('WALLET_ARCHIVED')
    }
    await sleep(2000)
  }
  throw new Error('WALLET_NOT_ACTIVE')
}

export async function createCoboAgentWallet(state: DemoState): Promise<WalletPreparation> {
  const prep = state.walletPreparation
  if (prep.steps.eoa !== 'completed') {
    throw new Error('EOA_NOT_CONNECTED')
  }

  const walletsApi = createCoboWalletsApi(state)
  const networkConfig = getNetworkChainConfig(prep.network)
  const mainNodeId = process.env.AGENT_WALLET_MAIN_NODE_ID?.trim()

  try {
    const createResp = await walletsApi.createWallet({
      wallet_type: 'MPC',
      name: `YieldAgent-${Date.now()}`,
      group_type: 'agent',
      ...(mainNodeId ? { main_node_id: mainNodeId } : {}),
    })

    const walletUuid = createResp.data.result.uuid
    await waitForWalletActive(walletsApi, walletUuid)

    const addrResp = await walletsApi.createWalletAddress(walletUuid, {
      chain_id: networkConfig.coboChainId,
    })

    const address = addrResp.data.result.address
    if (!address) {
      throw new Error('ADDRESS_NOT_CREATED')
    }

    return markAgentWalletCreated(state, {
      address,
      coboWalletId: walletUuid,
    })
  } catch (err) {
    throw new Error(extractCoboErrorMessage(err))
  }
}

export async function fetchUsdcBalanceFromCobo(
  state: DemoState,
  network?: NetworkId,
): Promise<number> {
  const prep = state.walletPreparation
  const walletId = prep.agentWallet.coboWalletId
  if (!walletId || !prep.agentWallet.created) return 0

  const net = network ?? prep.network
  const networkConfig = getNetworkChainConfig(net)
  const balanceApi = createCoboBalanceApi(state)

  try {
    const resp = await balanceApi.listBalances(
      walletId,
      networkConfig.coboChainId,
      prep.agentWallet.address,
      networkConfig.coboTokenId,
      true,
      50,
    )

    const balances = resp.data.result ?? []
    const usdc = balances.find((b) =>
      b.token_id === networkConfig.coboTokenId
      || b.token_id.toUpperCase().includes('USDC'),
    )

    if (!usdc?.amount) return 0
    const parsed = Number.parseFloat(usdc.amount)
    return Number.isFinite(parsed) ? parsed : 0
  } catch {
    return prep.funding.availableUsdc
  }
}

export async function syncWalletSummaryFromCobo(state: DemoState): Promise<void> {
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
  state: DemoState,
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
  touchPreparation(prep)

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
    touchPreparation(prep)

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
