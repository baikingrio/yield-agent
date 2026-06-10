import type {
  AppState,
  CawDeploymentBlocker,
  CawDeploymentCheck,
} from '../../shared/types/app'
import { getCoboBasePath, getCoboEnvironment } from './cobo-config'

export interface CawDeploymentProbe {
  tssOnline: boolean | null
  boundTssNodeId: string | null
  walletStatus: string | null
}

function apiKeySource(state: AppState): CawDeploymentCheck['apiKeySource'] {
  if (state.settings.coboApiKey?.trim()) return 'settings'
  if (process.env.AGENT_WALLET_API_KEY?.trim()) return 'env'
  return 'missing'
}

function detectRuntime(): CawDeploymentCheck['runtime'] {
  if (process.env.AGENT_WALLET_TSS_RUNTIME === 'hermes-agent-host') return 'hermes-agent-host'
  if (process.env.VERCEL === '1') return 'hermes-agent-host'
  return 'unknown'
}

function preferEnvKey(): boolean {
  return process.env.AGENT_WALLET_TSS_RUNTIME === 'hermes-agent-host'
    || process.env.VERCEL === '1'
}

function isEphemeralDatabase(): boolean {
  return process.env.VERCEL === '1' && !process.env.DATABASE_PATH?.trim()
}

function buildEnvTemplate(mainNodeId: string | null): string {
  const env = getCoboEnvironment()
  const apiUrl = getCoboBasePath()
  const lines = [
    `AGENT_WALLET_ENV=${env}`,
    `AGENT_WALLET_API_URL=${apiUrl}`,
    'AGENT_WALLET_API_KEY=<Hermes: caw wallet current --show-api-key>',
    `AGENT_WALLET_MAIN_NODE_ID=${mainNodeId ?? '<Hermes: caw node status tss_node_id>'}`,
    'AGENT_WALLET_TSS_RUNTIME=hermes-agent-host',
    '# DATABASE_PATH=<持久化 SQLite 路径，Vercel 强烈建议配置>',
  ]
  return lines.join('\n')
}

function buildNextActions(blockers: CawDeploymentBlocker[]): string[] {
  const actions: string[] = []
  if (blockers.includes('missing_api_key')) {
    actions.push('在 Vercel 环境变量设置 AGENT_WALLET_API_KEY（与 Hermes caw onboard 相同）')
  }
  if (blockers.includes('prefer_env_api_key')) {
    actions.push('将 API Key 从会话设置迁移到 Vercel 环境变量 AGENT_WALLET_API_KEY')
  }
  if (blockers.includes('missing_main_node')) {
    actions.push('配置 AGENT_WALLET_MAIN_NODE_ID 为 Hermes 主机 TSS Node ID')
  }
  if (blockers.includes('node_id_mismatch')) {
    actions.push('核对 Vercel MAIN_NODE_ID 与钱包绑定的 TSS 节点是否一致')
  }
  if (blockers.includes('tss_offline')) {
    actions.push('在 Hermes 主机运行 caw node start 并确认节点在线')
  }
  if (blockers.includes('wallet_preparing')) {
    actions.push('若超过 5 分钟仍为 preparing：先核对 Hermes TSS 与 API Key，再点击「继续初始化」（勿重复创建）')
  }
  if (blockers.includes('ephemeral_database')) {
    actions.push('在 Vercel 配置持久化 DATABASE_PATH（如 Turso），避免实例重启后重复创建 Agent 钱包')
  }
  if (actions.length === 0) {
    actions.push('部署自检通过，可继续 Agent Wallet 初始化')
  }
  return actions
}

export function buildCawDeploymentCheck(
  state: AppState,
  probe: CawDeploymentProbe = { tssOnline: null, boundTssNodeId: null, walletStatus: null },
): CawDeploymentCheck {
  const source = apiKeySource(state)
  const apiKeyConfigured = source !== 'missing'
  const mainNodeId = process.env.AGENT_WALLET_MAIN_NODE_ID?.trim() || null
  const mainNodeConfigured = Boolean(mainNodeId)
  const walletId = state.walletPreparation.agentWallet.coboWalletId
  const shouldPreferEnv = preferEnvKey()
  const blockers: CawDeploymentBlocker[] = []

  if (shouldPreferEnv && !apiKeyConfigured) {
    blockers.push('missing_api_key')
  }
  if (shouldPreferEnv && source === 'settings') {
    blockers.push('prefer_env_api_key')
  }
  if (shouldPreferEnv && !mainNodeConfigured) {
    blockers.push('missing_main_node')
  }
  if (probe.tssOnline === false) {
    blockers.push('tss_offline')
  }
  if (
    mainNodeId
    && probe.boundTssNodeId
    && mainNodeId !== probe.boundTssNodeId
  ) {
    blockers.push('node_id_mismatch')
  }
  if (probe.walletStatus === 'preparing') {
    blockers.push('wallet_preparing')
  }
  if (isEphemeralDatabase()) {
    blockers.push('ephemeral_database')
  }

  const mainNodeMatchesBound = mainNodeId && probe.boundTssNodeId
    ? mainNodeId === probe.boundTssNodeId
    : null

  return {
    runtime: detectRuntime(),
    apiKeyConfigured,
    apiKeySource: source,
    preferEnvKey: shouldPreferEnv,
    mainNodeConfigured,
    mainNodeId,
    tssOnline: probe.tssOnline,
    boundTssNodeId: probe.boundTssNodeId,
    mainNodeMatchesBound,
    walletId,
    walletStatus: probe.walletStatus,
    blockers,
    nextActions: buildNextActions(blockers),
    envTemplate: buildEnvTemplate(mainNodeId),
  }
}
