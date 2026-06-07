import { getState, persistCurrentState } from '../../../utils/demo-store'
import { simulatePactDenial } from '../../../utils/cobo-execution'

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

  try {
    const result = await simulatePactDenial(state, pact.id)
    persistCurrentState()
    return result
  } catch (err) {
    throw createError({
      statusCode: 502,
      data: { error: err instanceof Error ? err.message : '越权模拟失败' },
    })
  }
})
