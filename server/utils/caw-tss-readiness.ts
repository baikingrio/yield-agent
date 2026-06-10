import type { AppState } from '../../shared/types/app'
import {
  createCoboWalletsApi,
  extractCoboErrorMessage,
  isCoboConfigured,
  withCoboRetry,
} from './cobo-client'
import {
  bool,
  defaultCawRunner,
  resolveCawCliBin,
  runCawJsonBestEffort,
  str,
  type CawCliRunner,
} from './caw-cli'

export async function checkTssReadiness(
  state: AppState,
  walletId?: string | null,
  runner: CawCliRunner = defaultCawRunner,
): Promise<{ online: boolean; nodeId: string | null; source: 'cli-local' | 'sdk-remote' | 'none'; message: string }> {
  const cawBin = await resolveCawCliBin()
  if (cawBin) {
    try {
      const status = await runCawJsonBestEffort(['node', 'status'], runner) as Record<string, unknown>
      const remote = status.remote as Record<string, unknown> | undefined
      const local = status.local as Record<string, unknown> | undefined
      const online = bool(remote?.online) || bool(local?.running)
      return {
        online,
        nodeId: str(remote?.tss_node_id),
        source: 'cli-local',
        message: online ? 'TSS Node 在线' : 'TSS Node 未在线，请运行 caw node start',
      }
    } catch {
      // Fall through to SDK remote check.
    }
  }

  const mainNodeId = process.env.AGENT_WALLET_MAIN_NODE_ID?.trim()
  const targetWalletId = walletId ?? state.walletPreparation.agentWallet.coboWalletId

  if (mainNodeId && !targetWalletId && !cawBin) {
    return {
      online: true,
      nodeId: mainNodeId,
      source: 'sdk-remote',
      message: '将使用远程 TSS Node 创建 MPC 钱包',
    }
  }

  if (targetWalletId && !isCoboConfigured(state)) {
    return {
      online: false,
      nodeId: mainNodeId ?? null,
      source: 'none',
      message: mainNodeId
        ? 'Cobo API Key 未配置。请在 Vercel 设置 AGENT_WALLET_API_KEY（与 Hermes caw onboard 相同），然后点击「继续初始化」'
        : '请先在设置页 Provision Cobo API Key，或配置 AGENT_WALLET_API_KEY',
    }
  }

  if (targetWalletId && isCoboConfigured(state)) {
    try {
      const walletsApi = createCoboWalletsApi(state)
      const nodeResp = await withCoboRetry(() => walletsApi.getWalletNodeStatus(targetWalletId))
      const online = nodeResp.data.result?.online === true
      return {
        online,
        nodeId: str(nodeResp.data.result?.tss_node_id) ?? process.env.AGENT_WALLET_MAIN_NODE_ID?.trim() ?? null,
        source: 'sdk-remote',
        message: online ? '远程 TSS Node 在线' : '远程 TSS Node 未在线',
      }
    } catch (err) {
      const raw = extractCoboErrorMessage(err)
      if (raw.toLowerCase().includes('not authorized for this wallet')) {
        return {
          online: false,
          nodeId: process.env.AGENT_WALLET_MAIN_NODE_ID?.trim() ?? null,
          source: 'sdk-remote',
          message: 'API Key 与钱包不匹配。请使用 Hermes 上 caw wallet current --show-api-key 的 Key，重置后重建或导入钱包',
        }
      }
      return {
        online: false,
        nodeId: process.env.AGENT_WALLET_MAIN_NODE_ID?.trim() ?? null,
        source: 'sdk-remote',
        message: `无法查询远程 TSS Node 状态：${raw}`,
      }
    }
  }

  return {
    online: false,
    nodeId: mainNodeId ?? null,
    source: 'none',
    message: mainNodeId
      ? '无法查询远程 TSS Node 状态，请确认 Hermes 主机 TSS 在线且已配置 AGENT_WALLET_API_KEY'
      : '请先配置 TSS Node 或完成 CAW onboard',
  }
}

export function buildSdkPreparingMessage(
  walletStatus: string | null,
  tss: { online: boolean; nodeId: string | null; message: string },
): string {
  const configuredMainNodeId = process.env.AGENT_WALLET_MAIN_NODE_ID?.trim() ?? null

  if (!walletStatus) {
    return '无法从 Cobo API 读取钱包状态，请确认 API Key 与网络配置'
  }

  if (!tss.online) {
    return `钱包状态 ${walletStatus}，但 TSS Node 离线。请在 Hermes 主机运行 caw node start`
  }

  const boundNodeId = tss.nodeId
  if (configuredMainNodeId && boundNodeId && configuredMainNodeId !== boundNodeId) {
    return `钱包 ${walletStatus}，绑定 TSS 节点 (${boundNodeId}) 与 AGENT_WALLET_MAIN_NODE_ID (${configuredMainNodeId}) 不一致`
  }

  const nodeHint = boundNodeId ?? configuredMainNodeId ?? '未知'
  return `SDK 钱包仍在 ${walletStatus}，等待 vault 初始化。请确认 Hermes 主机 caw node 在线（节点 ${nodeHint}）`
}
