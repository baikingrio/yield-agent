import { z } from 'zod'
import { runCawOnboardStep } from '../../../utils/caw-onboard'

const Body = z.object({
  agentName: z.string().trim().min(1).default('YieldAgent'),
  wait: z.boolean().optional(),
})

export default defineEventHandler(async (event) => {
  const parsed = Body.safeParse(await readBody(event).catch(() => ({})))
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid CAW onboard start request' })
  }

  try {
    return await runCawOnboardStep({
      agentName: parsed.data.agentName,
      wait: parsed.data.wait,
    })
  } catch (err) {
    throw createError({
      statusCode: 502,
      statusMessage: 'CAW onboard start failed',
      data: { error: err instanceof Error ? err.message : 'CAW onboard start failed' },
    })
  }
})
