import { z } from 'zod'
import { getState } from '../../utils/app-store'
import { getWithdrawInfo, MAX_WALLET_OP_USDC, MIN_WALLET_OP_USDC } from '../../utils/wallet-ops'

const schema = z.object({
  amountUsdc: z.coerce.number().min(MIN_WALLET_OP_USDC).max(MAX_WALLET_OP_USDC).optional(),
})

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const parsed = schema.safeParse(query)

  if (!parsed.success) {
    throw createError({ statusCode: 400, data: { error: '请输入 10–10,000 USDC' } })
  }

  const state = getState()

  try {
    const info = await getWithdrawInfo(state)

    if (parsed.data.amountUsdc !== undefined && parsed.data.amountUsdc > info.maxWithdrawUsdc) {
      throw createError({
        statusCode: 400,
        data: {
          error: `可提余额不足（当前 ${info.liquidUsdc.toLocaleString('zh-CN')} USDC）`,
          ...info,
        },
      })
    }

    return info
  } catch (e) {
    const msg = e instanceof Error ? e.message : '无法读取提取信息'
    throw createError({ statusCode: 400, data: { error: msg } })
  }
})
