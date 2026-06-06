import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import type { DemoState, NetworkId, WalletPreparation } from '../../shared/types/demo'
import { getCoboBasePath, getNetworkChainConfig } from './cobo-config'
import {
  createCoboBalanceApi,
  createCoboWalletsApi,
  extractCoboErrorMessage,
} from './cobo-client'
import { verifyUsdcDeposit } from './deposit-verify'
import { provisionCawPrincipal } from './caw-provision'
import {
  applyDepositToState,
  markAgentWalletCreated,
  touchPreparation,
} from './wallet-preparation'

const execFileAsync = promisify(execFile)
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

interface PairInitiateResponse {
  success?: boolean
  message?: string
  suggestion?: string
  result?: {
    token?: string
    expires_at?: string
    expire_at?: string
    expired_at?: string
  }
}

function currentCoboApiKey(state: DemoState): string | null {
  return state.settings.coboApiKey?.trim() || process.env.AGENT_WALLET_API_KEY?.trim() || null
}

async function ensureCawPrincipal(state: DemoState): Promise<void> {
  if (currentCoboApiKey(state)) return
  await provisionCawPrincipal(state, { name: 'YieldAgent Dev' })
}

async function initiateWalletPairing(
  state: DemoState,
  walletId: string,
): Promise<{ status: 'pairing'; code: string | null; expiresAt: string | null } | undefined> {
  const apiKey = currentCoboApiKey(state)
  if (!apiKey) return undefined

  const resp = await fetch(`${getCoboBasePath()}/api/v1/wallets/pairs/initiate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey,
    },
    body: JSON.stringify({ wallet_id: walletId }),
  })
  const payload = await resp.json().catch(() => ({})) as PairInitiateResponse
  if (!resp.ok || payload.success === false) {
    throw new Error(payload.message || payload.suggestion || `CAW wallet pairing failed with HTTP ${resp.status}`)
  }

  return {
    status: 'pairing',
    code: payload.result?.token ?? null,
    expiresAt: payload.result?.expires_at ?? payload.result?.expire_at ?? payload.result?.expired_at ?? null,
  }
}

async function runCawJson(args: string[]): Promise<Record<string, unknown> | unknown[]> {
  const {
    AGENT_WALLET_API_KEY: _apiKey,
    AGENT_WALLET_API_URL: _apiUrl,
    ...safeEnv
  } = process.env

  const { stdout } = await execFileAsync('caw', args, {
    timeout: 120_000,
    maxBuffer: 1024 * 1024,
    env: {
      ...safeEnv,
      PATH: `/usr/local/bin:${process.env.PATH ?? ''}`,
    },
  })
  return JSON.parse(stdout || '{}') as Record<string, unknown> | unknown[]
}

function str(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
}

async function adoptCurrentCawWalletFromCli(state: DemoState): Promise<WalletPreparation> {
  const prep = state.walletPreparation
  const networkConfig = getNetworkChainConfig(prep.network)
  const walletPayload = await runCawJson(['wallet', 'current'])
  if (Array.isArray(walletPayload)) throw new Error('CAW_CURRENT_WALLET_NOT_FOUND')

  const walletUuid = str(walletPayload.wallet_uuid)
  if (!walletUuid) throw new Error('CAW_CURRENT_WALLET_NOT_FOUND')

  let addressesPayload: Record<string, unknown>[] = []
  try {
    const payload = await runCawJson(['address', 'list'])
    if (Array.isArray(payload)) addressesPayload = payload as Record<string, unknown>[]
  } catch {
    addressesPayload = []
  }

  const addressEntry = addressesPayload.find((item) => {
    if (!item || typeof item !== 'object') return false
    const obj = item as Record<string, unknown>
    const compatibleChains = obj.compatible_chains
    return (
      str(obj.wallet_id) === walletUuid
      && str(obj.address)
      && (
        (isStringArray(compatibleChains) && compatibleChains.includes(networkConfig.coboChainId))
        || str(obj.chain_type) === 'ETH'
      )
    )
  }) as Record<string, unknown> | undefined

  const configuredAddress = str(process.env.CAW_EXISTING_EVM_ADDRESS)
  const address = str(addressEntry?.address) ?? configuredAddress
  if (!address) throw new Error('CAW_ADDRESS_NOT_FOUND')

  return markAgentWalletCreated(state, {
    address,
    coboWalletId: walletUuid,
  })
}

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

  await ensureCawPrincipal(state)

  if (prep.agentWallet.created && prep.agentWallet.coboWalletId && prep.agentWallet.address) {
    if (prep.agentWallet.pairing?.status === 'paired') return prep
    return markAgentWalletCreated(state, {
      address: prep.agentWallet.address,
      coboWalletId: prep.agentWallet.coboWalletId,
      pairing: await initiateWalletPairing(state, prep.agentWallet.coboWalletId),
    })
  }

  const walletsApi = createCoboWalletsApi(state)
  const networkConfig = getNetworkChainConfig(prep.network)
  const mainNodeId = process.env.AGENT_WALLET_MAIN_NODE_ID?.trim()

  // On this Hermes host the CAW onboarding flow already created and paired an
  // Agent Wallet. Prefer adopting that active wallet for the demo preparation
  // flow instead of attempting to create another wallet with a pact-scoped key.
  if (process.env.CAW_ADOPT_EXISTING_WALLET !== 'false') {
    try {
      return await adoptCurrentCawWalletFromCli(state)
    } catch {
      // Fall back to normal Cobo wallet creation when no local CAW wallet exists.
    }
  }

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
      pairing: await initiateWalletPairing(state, walletUuid),
    })
  } catch (err) {
    const message = extractCoboErrorMessage(err)

    // When the configured CAW credential belongs to an already-onboarded/paired
    // agent, creating another wallet may be forbidden. For the hackathon demo we
    // can still complete the wallet-preparation flow by adopting the active CAW
    // wallet that is already paired to this Hermes Agent host. Try that fallback
    // for any createWallet failure, then surface the original CAW API error only
    // if the local CAW wallet cannot be adopted.
    try {
      return await adoptCurrentCawWalletFromCli(state)
    } catch (fallbackErr) {
      console.warn('CAW_CURRENT_WALLET_FALLBACK_FAILED', fallbackErr instanceof Error ? fallbackErr.message : fallbackErr)
      throw new Error(message)
    }
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
