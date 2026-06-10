import { z } from 'zod'
import { getState } from '../../utils/app-store'
import { parseStrategyNaturalLanguage } from '../../utils/hermes-strategy-parser'

const schema = z.object({
  text: z.string().min(1),
  limits: z.object({
    availableUsdc: z.number().nonnegative(),
    network: z.literal('base-sepolia'),
  }),
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parsed = schema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      data: { error: '请求参数无效' },
    })
  }

  const state = getState()

  try {
    return await parseStrategyNaturalLanguage(state, parsed.data.text, parsed.data.limits)
  } catch (err) {
    const message = err instanceof Error ? err.message : '策略解析失败'
    const fallbackAvailable = Boolean(
      err && typeof err === 'object' && 'fallbackAvailable' in err && (err as { fallbackAvailable?: boolean }).fallbackAvailable,
    )
    throw createError({
      statusCode: fallbackAvailable ? 503 : 400,
      data: { error: message, fallbackAvailable },
    })
  }
})
