import { getState } from '../../utils/app-store'
import { toPublicSettings } from '../../utils/settings'

export default defineEventHandler(() => {
  return toPublicSettings(getState().settings)
})
