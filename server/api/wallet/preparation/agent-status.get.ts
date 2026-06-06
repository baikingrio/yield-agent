import { getState } from '../../../utils/demo-store'
import { pollCoboAgentWalletStatus, syncFundingFromExistingBalance } from '../../../utils/cobo-preparation'
import { getWalletPreparation } from '../../../utils/wallet-preparation'
import { CoboNotConfiguredError } from '../../../utils/cobo-client'

export default defineEventHandler(async () => {
  const state = getState()

  try {
    const response = await pollCoboAgentWalletStatus(state)
    await syncFundingFromExistingBalance(state)
    return {
      ...response,
      preparation: getWalletPreparation(state),
    }
  } catch (e) {
    if (e instanceof CoboNotConfiguredError) {
      throw createError({
        statusCode: 400,
        data: { error: '请先在设置中配置 Cobo API Key' },
      })
    }
    if (e instanceof Error && e.message === 'EOA_NOT_CONNECTED') {
      throw createError({ statusCode: 400, data: { error: '请先连接 EOA 钱包' } })
    }
    throw createError({
      statusCode: 400,
      data: { error: e instanceof Error ? e.message : '查询 Agent Wallet 状态失败' },
    })
  }
})
