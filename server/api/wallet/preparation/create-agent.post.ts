import { getState } from '../../../utils/demo-store'
import { createCoboAgentWallet } from '../../../utils/cobo-preparation'
import { CoboNotConfiguredError, extractCoboErrorMessage } from '../../../utils/cobo-client'

export default defineEventHandler(async () => {
  const state = getState()

  try {
    return await createCoboAgentWallet(state)
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
      data: { error: extractCoboErrorMessage(e) },
    })
  }
})
