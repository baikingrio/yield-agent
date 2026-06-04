import { getState } from '../../../utils/demo-store'
import { disconnectEoa } from '../../../utils/wallet-preparation'

export default defineEventHandler(() => {
  const state = getState()
  return disconnectEoa(state)
})
