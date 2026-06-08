import { z } from 'zod'
import type { NetworkId } from '../../../shared/types/app'
import { getState } from '../../utils/app-store'
import { toPublicSettings } from '../../utils/settings'

const schema = z.object({
  network: z.enum(['base-sepolia', 'arbitrum-sepolia']).optional(),
  defaultAgentFee: z.number().min(0).max(30).optional(),
  userSplit: z.number().min(0).max(100).optional(),
  apiKey: z.string().optional(),
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parsed = schema.safeParse(body)

  if (!parsed.success) {
    throw createError({ statusCode: 400, data: { error: '请求参数无效' } })
  }

  const settings = getState().settings
  const data = parsed.data

  if (data.network) settings.network = data.network as NetworkId
  if (data.defaultAgentFee !== undefined) settings.defaultAgentFee = data.defaultAgentFee
  if (data.userSplit !== undefined) settings.userSplit = data.userSplit
  if (data.apiKey?.trim()) {
    settings.coboApiKey = data.apiKey.trim()
    settings.apiKeyConfigured = true
  }

  return toPublicSettings(settings)
})
