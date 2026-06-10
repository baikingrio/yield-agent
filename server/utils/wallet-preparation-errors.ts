import { AGENT_WALLET_API_KEY_REQUIRED } from './caw-wallet-bootstrap'
import { extractCoboErrorMessage } from './cobo-client'

export const WALLET_PREPARATION_ERROR_MESSAGES: Record<string, string> = {
  TSS_NOT_CONFIGURED:
    '未检测到可用的 TSS 运行时。请在本机安装 caw 并启动 TSS Node，或配置 AGENT_WALLET_MAIN_NODE_ID。',
  TSS_NODE_OFFLINE:
    'TSS Node 未在线。本机请运行 caw node start；远程请确认 Hermes 主机 TSS 在线且 MAIN_NODE_ID 正确。',
  WALLET_STILL_PREPARING:
    'Agent Wallet 仍在初始化（vault 尚未就绪）。请确认 TSS Node 在线，系统会自动续接初始化。',
  WALLET_NOT_ACTIVE: 'Agent Wallet 尚未激活，请稍后重试。',
  WALLET_ARCHIVED: 'Agent Wallet 已归档，请重置资金准备流程后重新创建。',
  ADDRESS_NOT_CREATED: '未能生成 Agent 链上地址，请稍后重试。',
  AGENT_WALLET_NOT_READY: 'Agent Wallet 尚未就绪，请先完成创建。',
  [AGENT_WALLET_API_KEY_REQUIRED]:
    'Vercel/Hermes 分体部署需在环境变量设置 AGENT_WALLET_API_KEY（与 Hermes caw onboard 相同）。请打开设置页查看部署自检。',
}

export function walletPreparationErrorMessage(err: unknown): string {
  if (err instanceof Error && WALLET_PREPARATION_ERROR_MESSAGES[err.message]) {
    return WALLET_PREPARATION_ERROR_MESSAGES[err.message]
  }
  return extractCoboErrorMessage(err)
}
