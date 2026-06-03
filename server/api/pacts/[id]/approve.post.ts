import { getState } from '../../../utils/demo-store'

export default defineEventHandler((event) => {
  const id = getRouterParam(event, 'id')
  const state = getState()
  const pact = state.pacts.find((p) => p.id === id)

  if (!pact) {
    throw createError({ statusCode: 404, data: { error: 'Pact not found' } })
  }

  if (pact.status === 'terminated') {
    throw createError({ statusCode: 400, data: { error: '已终止的 Pact 无法审批' } })
  }

  pact.status = 'active'
  return pact
})
