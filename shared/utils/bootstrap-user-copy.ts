import type { AgentBootstrapPhase } from '../types/app'

export type BootstrapUserCopySeverity = 'info' | 'warning' | 'error'

export interface BootstrapUserCopyInput {
  phase: AgentBootstrapPhase | null | undefined
  tssOnline: boolean | null | undefined
  message: string | null | undefined
  pollAttempt?: number
  maxPollAttempts?: number
}

export interface BootstrapUserCopy {
  title: string
  body: string
  severity: BootstrapUserCopySeverity
  ctaLabel: string | null
  ctaHref: string | null
  showOpsChecklist: boolean
  showTechnicalDetails: boolean
}

const SETTINGS_HREF = '/dashboard/settings'

function messageIncludes(message: string | null | undefined, fragment: string): boolean {
  return Boolean(message?.toLowerCase().includes(fragment.toLowerCase()))
}

export function mapBootstrapUserCopy(input: BootstrapUserCopyInput): BootstrapUserCopy {
  const {
    phase = 'idle',
    tssOnline,
    message,
    pollAttempt = 0,
    maxPollAttempts = 24,
  } = input

  const timedOut = pollAttempt >= maxPollAttempts && maxPollAttempts > 0

  if (phase === 'tss_check' && tssOnline === false) {
    if (messageIncludes(message, '不匹配') || messageIncludes(message, 'not authorized')) {
      return {
        title: '凭证与钱包不匹配',
        body: '当前 API Key 无权操作此 Agent Wallet。请使用 Hermes 的 Key，重置后优先「导入已 onboard 钱包」。',
        severity: 'error',
        ctaLabel: '查看部署自检',
        ctaHref: SETTINGS_HREF,
        showOpsChecklist: true,
        showTechnicalDetails: true,
      }
    }
    if (messageIncludes(message, 'api key') || messageIncludes(message, '未配置')) {
      return {
        title: '缺少 Cobo 凭证',
        body: '分体部署需在 Vercel 设置 AGENT_WALLET_API_KEY，且与 Hermes 上 caw onboard 的 Key 一致。',
        severity: 'error',
        ctaLabel: '打开部署自检',
        ctaHref: SETTINGS_HREF,
        showOpsChecklist: true,
        showTechnicalDetails: true,
      }
    }
    return {
      title: 'TSS Node 未就绪',
      body: message ?? '请确认 Hermes 主机 caw node 在线，且 MAIN_NODE_ID 配置正确。',
      severity: 'warning',
      ctaLabel: '查看部署自检',
      ctaHref: SETTINGS_HREF,
      showOpsChecklist: true,
      showTechnicalDetails: true,
    }
  }

  if (phase === 'bootstrapping' && timedOut) {
    return {
      title: '初始化耗时较长',
      body: 'Vault 仍未就绪。请按下方运维清单逐项检查，或重置后导入 Hermes 上已 active 的钱包。',
      severity: 'warning',
      ctaLabel: '打开部署自检',
      ctaHref: SETTINGS_HREF,
      showOpsChecklist: true,
      showTechnicalDetails: true,
    }
  }

  if (phase === 'bootstrapping') {
    return {
      title: 'Vault 初始化中',
      body: message ?? 'MPC vault 正在完成初始化，通常需要 1–3 分钟。',
      severity: 'info',
      ctaLabel: null,
      ctaHref: null,
      showOpsChecklist: false,
      showTechnicalDetails: Boolean(message),
    }
  }

  if (phase === 'pairing') {
    return {
      title: '等待 CAW App 配对',
      body: '请在 Cobo Agentic Wallet App 输入配对码完成所有权确认。',
      severity: 'info',
      ctaLabel: null,
      ctaHref: null,
      showOpsChecklist: false,
      showTechnicalDetails: Boolean(message),
    }
  }

  if (phase === 'active') {
    return {
      title: '钱包已激活',
      body: '可生成配对码或继续注资步骤。',
      severity: 'info',
      ctaLabel: null,
      ctaHref: null,
      showOpsChecklist: false,
      showTechnicalDetails: false,
    }
  }

  return {
    title: '准备 Agent Wallet',
    body: message ?? '点击「创建 Agent Wallet」或「导入已 onboard 钱包」开始。',
    severity: 'info',
    ctaLabel: null,
    ctaHref: null,
    showOpsChecklist: false,
    showTechnicalDetails: Boolean(message),
  }
}
