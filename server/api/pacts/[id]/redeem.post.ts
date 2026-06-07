import { getState, persistCurrentState } from '../../../utils/demo-store'
import { redeemPactFunds } from '../../../utils/cobo-execution'
import { extractCoboErrorMessage } from '../../../utils/cobo-client'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, data: { error: '缺少 Pact ID' } })
  }

  const state = getState()
  const pact = state.pacts.find((p) => p.id === id || p.coboPactId === id)
  if (!pact) {
    throw createError({ statusCode: 404, data: { error: 'Pact not found' } })
  }

  if (pact.submissionMode !== 'cobo') {
    throw createError({ statusCode: 400, data: { error: '仅 Cobo Pact 支持链上赎回' } })
  }

  try {
    const result = await redeemPactFunds(state, pact.id)
    persistCurrentState()
    return result
  } catch (err) {
    persistCurrentState()
    throw createError({
      statusCode: 502,
      data: { error: err instanceof Error ? err.message : extractCoboErrorMessage(err) },
    })
  }
})
