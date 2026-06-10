import { getState } from '../../../utils/app-store'
import { createCoboAgentWallet } from '../../../utils/cobo-preparation'
import { CoboNotConfiguredError } from '../../../utils/cobo-client'
import { walletPreparationErrorMessage } from '../../../utils/wallet-preparation-errors'

export default defineEventHandler(async () => {
  const state = getState()

  try {
    const prep = await createCoboAgentWallet(state)
    const bootstrap = prep.agentBootstrap ?? null
    return { preparation: prep, bootstrap, done: prep.steps.agent_wallet === 'completed' }
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
      data: { error: walletPreparationErrorMessage(e) },
    })
  }
})
