import { z } from 'zod'
import { getState } from '../../utils/app-store'
import { buildCawReadiness } from '../../utils/caw-readiness'
import { provisionCawPrincipal } from '../../utils/caw-provision'

const schema = z.object({
  name: z.string().trim().min(2).max(80).default('YieldAgent Dev'),
})

export default defineEventHandler(async (event) => {
  const parsed = schema.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({ statusCode: 400, data: { error: 'Agent 名称无效' } })
  }

  const state = getState()

  try {
    const provision = await provisionCawPrincipal(state, { name: parsed.data.name })
    setResponseStatus(event, 201)
    return {
      provision,
      readiness: buildCawReadiness(state),
    }
  } catch (err) {
    throw createError({
      statusCode: 502,
      data: { error: err instanceof Error ? err.message : 'CAW Agent provision 失败' },
    })
  }
})
