import { z } from 'zod'
import { getState, persistCurrentState } from '../../utils/app-store'
import { withdrawUsdcToEoa } from '../../utils/wallet-ops'

const schema = z.object({
  amountUsdc: z.number().min(10).max(10_000),
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parsed = schema.safeParse(body)

  if (!parsed.success) {
    throw createError({ statusCode: 400, data: { error: '请输入 10–10,000 USDC' } })
  }

  const state = getState()

  try {
    const result = await withdrawUsdcToEoa(state, parsed.data.amountUsdc)
    persistCurrentState()
    return result
  } catch (e) {
    const msg = e instanceof Error ? e.message : '提取失败，请重试'
    throw createError({ statusCode: 400, data: { error: msg } })
  }
})
