import { pingHermesStrategyAgent } from '../../utils/hermes-strategy-client'

export default defineEventHandler(async () => {
  try {
    return await pingHermesStrategyAgent()
  } catch (err) {
    throw createError({
      statusCode: 502,
      statusMessage: 'Hermes Agent remote call failed',
      data: { error: err instanceof Error ? err.message : 'Hermes Agent remote call failed' },
    })
  }
})
