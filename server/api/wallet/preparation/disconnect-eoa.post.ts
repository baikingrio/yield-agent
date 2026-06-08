import { getState } from '../../../utils/app-store'
import { disconnectEoa } from '../../../utils/wallet-preparation'

export default defineEventHandler(() => {
  const state = getState()
  return disconnectEoa(state)
})
