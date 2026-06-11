import { z } from 'zod'
import { MAX_WALLET_OP_USDC, MIN_WALLET_OP_USDC } from '#shared/types/app'
import { getState, persistCurrentState } from '../../utils/app-store'
import { withdrawUsdcToEoa } from '../../utils/wallet-ops'

const amountRangeError = `请输入 ${MIN_WALLET_OP_USDC}–${MAX_WALLET_OP_USDC.toLocaleString('en-US')} USDC`

const schema = z.object({
  amountUsdc: z.number().min(MIN_WALLET_OP_USDC).max(MAX_WALLET_OP_USDC),
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parsed = schema.safeParse(body)

  if (!parsed.success) {
    throw createError({ statusCode: 400, data: { error: amountRangeError } })
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
