import type { AppState } from '../../shared/types/app'
import { getNetworkChainConfig } from './cobo-config'
import { createCoboWalletsApi, withCoboRetry } from './cobo-client'
import { ensureCawCredentials } from './caw-credentials'
import { markAgentWalletPreparing } from './wallet-preparation'

export async function getWalletStatusFromSdk(state: AppState, walletUuid: string): Promise<string | null> {
  try {
    const walletsApi = createCoboWalletsApi(state)
    const detail = (await withCoboRetry(() => walletsApi.getWallet(walletUuid))).data.result
    return detail.status ?? null
  } catch {
    return null
  }
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

export async function bootstrapViaSdkCreate(state: AppState): Promise<void> {
  const prep = state.walletPreparation
  if (prep.agentWallet.coboWalletId) return

  await ensureCawCredentials(state)
  const walletsApi = createCoboWalletsApi(state)
  const mainNodeId = process.env.AGENT_WALLET_MAIN_NODE_ID?.trim()
  const createResp = await withCoboRetry(() => walletsApi.createWallet({
    wallet_type: 'MPC',
    name: `YieldAgent-${Date.now()}`,
    group_type: 'agent',
    ...(mainNodeId ? { main_node_id: mainNodeId } : {}),
  }))
  rememberPendingAgentWallet(state, createResp.data.result.uuid)
}
