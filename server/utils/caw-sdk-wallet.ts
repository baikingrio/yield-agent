import type { AppState } from '../../shared/types/app'
import { getNetworkChainConfig } from './cobo-config'
import { createCoboWalletsApi, extractCoboErrorMessage, withCoboRetry } from './cobo-client'
import { ensureCawCredentials } from './caw-credentials'
import { markAgentWalletPreparing } from './wallet-preparation'
import { isYieldAgentWalletName, yieldAgentWalletName } from './yield-agent-wallet-name'

export interface WalletStatusProbe {
  status: string | null
  readError: string | null
  inferredFrom: 'wallet' | 'address' | 'tss' | null
}

function isPactScopedWalletAuthGap(message: string): boolean {
  const normalized = message.toLowerCase()
  return normalized.includes('api key pact authorization')
    || (normalized.includes('agent wallet') && normalized.includes('提交 pact'))
}

export async function probeWalletStatusFromSdk(
  state: AppState,
  walletUuid: string,
): Promise<WalletStatusProbe> {
  const walletsApi = createCoboWalletsApi(state)
  let readError: string | null = null

  try {
    const detail = (await withCoboRetry(() => walletsApi.getWallet(walletUuid))).data.result
    const status = detail?.status ?? null
    if (status) return { status, readError: null, inferredFrom: 'wallet' }
  } catch (err) {
    readError = extractCoboErrorMessage(err)
  }

  try {
    const address = await resolveEvmAddressFromSdk(state, walletUuid)
    if (address) {
      return { status: 'active', readError, inferredFrom: 'address' }
    }
  } catch {
    // Fall through to node-status inference.
  }

  const configuredMainNodeId = process.env.AGENT_WALLET_MAIN_NODE_ID?.trim() ?? null
  try {
    const nodeResp = await withCoboRetry(() => walletsApi.getWalletNodeStatus(walletUuid))
    if (nodeResp.data.result?.online === true) {
      return { status: 'preparing', readError, inferredFrom: 'tss' }
    }
  } catch (err) {
    const nodeErr = extractCoboErrorMessage(err)
    if (isPactScopedWalletAuthGap(nodeErr) && configuredMainNodeId) {
      return { status: 'preparing', readError: readError ?? nodeErr, inferredFrom: 'tss' }
    }
    if (!readError) readError = nodeErr
  }

  if (readError) {
    const normalized = readError.toLowerCase()
    if (normalized.includes('not authorized for this wallet')) {
      return { status: null, readError, inferredFrom: null }
    }
    if (configuredMainNodeId) {
      return { status: 'preparing', readError, inferredFrom: 'tss' }
    }
  }

  return { status: null, readError, inferredFrom: null }
}

export async function getWalletStatusFromSdk(state: AppState, walletUuid: string): Promise<string | null> {
  const probe = await probeWalletStatusFromSdk(state, walletUuid)
  return probe.status
}

export async function resolveEvmAddressFromSdk(
  state: AppState,
  walletUuid: string,
): Promise<string | null> {
  const networkConfig = getNetworkChainConfig(state.walletPreparation.network)
  const walletsApi = createCoboWalletsApi(state)
  try {
    const addrResp = await withCoboRetry(() => walletsApi.createWalletAddress(walletUuid, {
      chain_id: networkConfig.coboChainId,
    }))
    const created = addrResp.data.result?.address
    if (created) return created
  } catch {
    // Fall back to list.
  }
  try {
    const listResp = await withCoboRetry(() => walletsApi.listWalletAddresses(walletUuid))
    const addresses = listResp.data.result ?? []
    const match = addresses.find((item) =>
      item.compatible_chains?.includes(networkConfig.coboChainId)
      || item.chain_type === 'ETH',
    )
    return match?.address ?? addresses[0]?.address ?? null
  } catch {
    return null
  }
}

function rememberPendingAgentWallet(state: AppState, walletUuid: string): void {
  markAgentWalletPreparing(state, {
    coboWalletId: walletUuid,
    pairing: { status: 'unpaired', code: null, expiresAt: null },
  })
}

function walletStatusRank(status: string): number {
  if (status === 'active') return 2
  if (status === 'preparing') return 1
  return 0
}

export async function findReusableYieldAgentWallet(
  state: AppState,
): Promise<{ uuid: string; status: string; name: string } | null> {
  const walletsApi = createCoboWalletsApi(state)
  const mainNodeId = process.env.AGENT_WALLET_MAIN_NODE_ID?.trim()
  const stableName = yieldAgentWalletName(state)

  try {
    const resp = await withCoboRetry(() => walletsApi.listWallets(
      undefined,
      undefined,
      0,
      50,
      false,
      mainNodeId || undefined,
    ))
    const wallets = resp.data.result ?? []
    const candidates = wallets.filter((wallet) =>
      wallet.name === stableName || isYieldAgentWalletName(wallet.name),
    )
    if (candidates.length === 0) return null

    candidates.sort((a, b) => {
      const rankDiff = walletStatusRank(b.status) - walletStatusRank(a.status)
      if (rankDiff !== 0) return rankDiff
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

    const exact = candidates.find((wallet) => wallet.name === stableName)
    const pick = exact ?? candidates.find((wallet) =>
      wallet.status === 'active' || wallet.status === 'preparing',
    ) ?? candidates[0]

    if (!pick?.uuid) return null
    return { uuid: pick.uuid, status: pick.status, name: pick.name }
  } catch {
    return null
  }
}

export interface SdkWalletCreateResult {
  adopted: boolean
  walletUuid: string
  walletName: string
}

export async function bootstrapViaSdkCreate(state: AppState): Promise<SdkWalletCreateResult> {
  const prep = state.walletPreparation
  if (prep.agentWallet.coboWalletId) {
    return {
      adopted: false,
      walletUuid: prep.agentWallet.coboWalletId,
      walletName: yieldAgentWalletName(state),
    }
  }

  await ensureCawCredentials(state)

  const reusable = await findReusableYieldAgentWallet(state)
  if (reusable) {
    rememberPendingAgentWallet(state, reusable.uuid)
    return { adopted: true, walletUuid: reusable.uuid, walletName: reusable.name }
  }

  const walletsApi = createCoboWalletsApi(state)
  const mainNodeId = process.env.AGENT_WALLET_MAIN_NODE_ID?.trim()
  const walletName = yieldAgentWalletName(state)

  try {
    const createResp = await withCoboRetry(() => walletsApi.createWallet({
      wallet_type: 'MPC',
      name: walletName,
      group_type: 'agent',
      ...(mainNodeId ? { main_node_id: mainNodeId } : {}),
    }))
    const walletUuid = createResp.data.result.uuid
    rememberPendingAgentWallet(state, walletUuid)
    return { adopted: false, walletUuid, walletName }
  } catch (err) {
    const fallback = await findReusableYieldAgentWallet(state)
    if (fallback) {
      rememberPendingAgentWallet(state, fallback.uuid)
      return { adopted: true, walletUuid: fallback.uuid, walletName: fallback.name }
    }
    throw err
  }
}
