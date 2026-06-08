import { z } from 'zod'
import { getState } from '../../../utils/app-store'
import { connectEoa } from '../../../utils/wallet-preparation'

const schema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, '无效的钱包地址'),
  label: z.string().optional(),
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parsed = schema.safeParse(body)

  if (!parsed.success) {
    throw createError({ statusCode: 400, data: { error: '请提供有效的 EOA 钱包地址' } })
  }

  const state = getState()

  try {
    return connectEoa(state, {
      address: parsed.data.address,
      label: parsed.data.label,
    })
  } catch (e) {
    const msg = e instanceof Error && e.message === 'INVALID_EOA_ADDRESS'
      ? '无效的钱包地址'
      : '无法登记 EOA 连接'
    throw createError({ statusCode: 400, data: { error: msg } })
  }
})
