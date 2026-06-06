import { z } from 'zod'
import { runCawOnboardStep } from '../../../utils/caw-onboard'

const Body = z.object({
  sessionId: z.string().trim().min(1),
  answers: z.record(z.string(), z.unknown()).default({}),
  wait: z.boolean().optional(),
})

export default defineEventHandler(async (event) => {
  const parsed = Body.safeParse(await readBody(event).catch(() => ({})))
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid CAW onboard continue request' })
  }

  try {
    return await runCawOnboardStep({
      sessionId: parsed.data.sessionId,
      answers: parsed.data.answers,
      wait: parsed.data.wait,
    })
  } catch (err) {
    throw createError({
      statusCode: 502,
      statusMessage: 'CAW onboard continue failed',
      data: { error: err instanceof Error ? err.message : 'CAW onboard continue failed' },
    })
  }
})
