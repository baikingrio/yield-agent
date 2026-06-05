import type { CawReadiness, DemoState } from '../../shared/types/demo'
import { getCoboBasePath, getCoboEnvironment } from './cobo-config'

function apiKeySource(state: DemoState): CawReadiness['apiKeySource'] {
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
    return '配置 AGENT_WALLET_MAIN_NODE_ID，并确认 TSS Node 在本地/VPS runtime 中运行。'
  }
  if (missing.includes('Agent Wallet')) {
    return '前往 Wallet 页面创建 Agent Wallet 并生成 EVM 地址。'
  }
  if (missing.includes('Funding')) {
    return '向 Agent Wallet 转入测试网 USDC 并完成到账确认。'
  }
  return 'CAW Pact 提交条件已满足，下一步可创建策略并提交 Cobo Pact。'
}

export function buildCawReadiness(state: DemoState): CawReadiness {
  const prep = state.walletPreparation
  const source = apiKeySource(state)
  const apiKeyConfigured = source !== 'missing'
  const mainNodeConfigured = Boolean(process.env.AGENT_WALLET_MAIN_NODE_ID?.trim())
  const agentWalletConfigured = Boolean(prep.agentWallet.created && prep.agentWallet.coboWalletId)
  const walletReady = prep.steps.agent_wallet === 'completed' && agentWalletConfigured
  const fundingReady = prep.ready && prep.funding.status === 'ready' && prep.funding.availableUsdc > 0
  const missing: string[] = []

  if (!apiKeyConfigured) missing.push('Cobo API Key')
  if (!mainNodeConfigured) missing.push('TSS Node ID')
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
