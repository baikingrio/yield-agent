import { getState } from '../../../utils/app-store'
import { importCoboAgentWalletFromCli } from '../../../utils/cobo-preparation'

const IMPORT_ERROR_MESSAGES: Record<string, string> = {
  EOA_NOT_CONNECTED: '请先连接 EOA 钱包',
  CAW_CURRENT_WALLET_NOT_FOUND: '未找到已 onboard 的 CAW 钱包。请先在 Hermes 主机运行 caw onboard 或在本机完成 onboard。',
  CAW_ADDRESS_NOT_FOUND: '已找到 CAW 钱包，但尚未生成 EVM 地址。请等待 onboard 完成后再导入。',
  CAW_CLI_NOT_FOUND: '未检测到 caw CLI。请安装 caw 并确保 TSS Node 在线。',
}

export default defineEventHandler(async () => {
  const state = getState()

  try {
    return await importCoboAgentWalletFromCli(state)
  } catch (e) {
    const message = e instanceof Error
      ? (IMPORT_ERROR_MESSAGES[e.message] ?? e.message)
      : '导入 CAW 钱包失败'
    throw createError({
      statusCode: 400,
      data: { error: message },
    })
  }
})
