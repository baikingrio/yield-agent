import { getCawOnboardStatus } from '../../../utils/caw-onboard'

export default defineEventHandler(async () => {
  try {
    return await getCawOnboardStatus()
  } catch (err) {
    throw createError({
      statusCode: 502,
      statusMessage: 'CAW onboard status failed',
      data: { error: err instanceof Error ? err.message : 'CAW onboard status failed' },
    })
  }
})
