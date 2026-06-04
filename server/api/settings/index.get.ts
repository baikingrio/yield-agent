import { getState } from '../../utils/demo-store'
import { toPublicSettings } from '../../utils/settings'

export default defineEventHandler(() => {
  return toPublicSettings(getState().settings)
})
