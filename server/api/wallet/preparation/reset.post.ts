import { getState } from '../../../utils/demo-store'
import { resetWalletPreparation } from '../../../utils/wallet-preparation'

export default defineEventHandler(() => {
  const state = getState()
  return resetWalletPreparation(state)
})
