import { getQuery } from 'h3'
import { getState, persistCurrentState } from '../../utils/app-store'
import { CoboNotConfiguredError, extractCoboErrorMessage } from '../../utils/cobo-client'
import { syncCoboPactsForAgentWallet } from '../../utils/cobo-pact-import'

export default defineEventHandler(async (event) => {
  const state = getState()

  if (getQuery(event).sync === 'true') {
    try {
      await syncCoboPactsForAgentWallet(state)
      persistCurrentState()
    } catch (err) {
      if (err instanceof CoboNotConfiguredError) {
        throw createError({
          statusCode: 400,
          data: {
            error: '请配置 AGENT_WALLET_API_KEY（与 Hermes caw wallet current --show-api-key 相同）以从 Cobo 同步策略',
          },
        })
      }
      console.warn('[yield-agent] Cobo strategy sync failed:', extractCoboErrorMessage(err))
    }
  }

  return state.strategies
})
