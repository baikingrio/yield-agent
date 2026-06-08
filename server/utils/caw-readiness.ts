import type { CawReadiness, AppState } from '../../shared/types/app'
import { getCoboBasePath, getCoboEnvironment } from './cobo-config'

function apiKeySource(state: AppState): CawReadiness['apiKeySource'] {
  if (state.settings.coboApiKey?.trim()) return 'settings'
  if (process.env.AGENT_WALLET_API_KEY?.trim()) return 'env'
  return 'missing'
}

function nextActionFor(missing: string[], readiness: Pick<CawReadiness, 'pactMode'>): string {
  if (readiness.pactMode === 'pact-execution-ready') {
    return 'Pact 已激活，可进入受限策略执行与交易审计。'
  }
  if (missing.includes('Cobo API Key')) {
    return 'Provision 或配置 Cobo API Key，当前只能创建本地 Pact Draft。'
  }
  if (missing.includes('TSS Node ID')) {
    return '配置 AGENT_WALLET_MAIN_NODE_ID，并确认 TSS Node 运行在当前 Hermes Agent 主机上；本机可运行 caw node start。'
  }
  if (missing.includes('TSS offline')) {
    return 'TSS Node 未在线。本机运行 caw node start，或确认 Hermes 主机 TSS 常驻。'
  }
  if (missing.includes('Onboard incomplete')) {
    return 'CAW onboard 尚未完成。可在 Wallet 页创建 Agent Wallet，或在设置页推进 onboard。'
  }
  if (missing.includes('Pairing pending')) {
    return '请在 CAW App 输入配对码完成所有权配对。'
  }
  if (missing.includes('Agent Wallet')) {
    return '前往 Wallet 页面创建 Agent Wallet 并生成 EVM 地址。'
  }
  if (missing.includes('Funding')) {
    return '向 Agent Wallet 转入测试网 USDC 并完成到账确认。'
  }
  return 'CAW Pact 提交条件已满足，下一步可创建策略并提交 Cobo Pact。'
}

export function buildCawReadiness(state: AppState): CawReadiness {
  const prep = state.walletPreparation
  const source = apiKeySource(state)
  const apiKeyConfigured = source !== 'missing'
  const mainNodeConfigured = Boolean(process.env.AGENT_WALLET_MAIN_NODE_ID?.trim())
  const agentWalletConfigured = Boolean(prep.agentWallet.created && prep.agentWallet.coboWalletId)
  const walletReady = prep.steps.agent_wallet === 'completed' && agentWalletConfigured
  const fundingReady = prep.ready && prep.funding.status === 'ready' && prep.funding.availableUsdc > 0
  const bootstrap = prep.agentBootstrap
  const missing: string[] = []

  if (!apiKeyConfigured) missing.push('Cobo API Key')
  if (!mainNodeConfigured) missing.push('TSS Node ID')
  if (bootstrap?.tssOnline === false) missing.push('TSS offline')
  if (prep.steps.agent_wallet === 'in_progress') missing.push('Onboard incomplete')
  if (agentWalletConfigured && prep.agentWallet.pairing?.status !== 'paired') {
    missing.push('Pairing pending')
  }
  if (!agentWalletConfigured) missing.push('Agent Wallet')
  if (!fundingReady) missing.push('Funding')

  const pactMode = apiKeyConfigured && agentWalletConfigured && fundingReady
    ? 'cobo-pact'
    : 'local-draft'

  const readiness: CawReadiness = {
    environment: getCoboEnvironment(),
    apiBaseUrl: getCoboBasePath(),
    apiKeyConfigured,
    apiKeySource: source,
    mainNodeConfigured,
    tssRuntime: 'hermes-agent-host',
    remoteRuntimeRequired: true,
    agentId: state.settings.agentId ?? null,
    agentWalletConfigured,
    agentWalletAddress: prep.agentWallet.address || null,
    walletReady,
    fundingReady,
    pactMode,
    missing,
    nextAction: '',
  }

  readiness.nextAction = nextActionFor(missing, readiness)
  return readiness
}
