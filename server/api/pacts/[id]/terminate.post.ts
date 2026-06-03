import { getState } from '../../../utils/demo-store'

export default defineEventHandler((event) => {
  const id = getRouterParam(event, 'id')
  const state = getState()
  const pact = state.pacts.find((p) => p.id === id)

  if (!pact) {
    throw createError({ statusCode: 404, data: { error: 'Pact not found' } })
  }

  pact.status = 'terminated'

  const strategy = state.strategies.find((s) => s.id === pact.strategyId)
  if (strategy) {
    strategy.status = 'paused'
  }

  return pact
})
