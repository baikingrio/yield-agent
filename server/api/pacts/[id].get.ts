import { getState } from '../../utils/demo-store'

export default defineEventHandler((event) => {
  const id = getRouterParam(event, 'id')
  const pact = getState().pacts.find((p) => p.id === id)

  if (!pact) {
    throw createError({ statusCode: 404, statusMessage: 'Pact not found', data: { error: 'Pact not found' } })
  }

  return pact
})
