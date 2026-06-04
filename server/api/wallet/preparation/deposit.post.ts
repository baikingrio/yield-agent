import { z } from 'zod'
import { getState } from '../../../utils/demo-store'
import { confirmUsdcDeposit } from '../../../utils/cobo-preparation'

const TX_HASH_RE = /^0x[a-fA-F0-9]{64}$/

const schema = z.object({
  amountUsdc: z.number().min(10).max(10_000),
  txHash: z.string().regex(TX_HASH_RE, '无效的交易哈希'),
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parsed = schema.safeParse(body)

  if (!parsed.success) {
    throw createError({ statusCode: 400, data: { error: '请提供有效的金额与交易哈希' } })
  }

  const state = getState()

  try {
    const result = await confirmUsdcDeposit(state, parsed.data.amountUsdc, parsed.data.txHash)

    state.logs.unshift({
      id: `log-deposit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: `EOA → Agent Wallet 注入 ${parsed.data.amountUsdc} USDC`,
      type: 'supply',
      txHash: parsed.data.txHash,
      status: '成功',
    })

    return result
  } catch (e) {
    const msg = e instanceof Error ? e.message : '转入失败，请重试'
    throw createError({ statusCode: 400, data: { error: msg } })
  }
})
