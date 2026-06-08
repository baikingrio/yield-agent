import { getState } from '../../../utils/app-store'
import { resetWalletPreparation } from '../../../utils/wallet-preparation'

export default defineEventHandler(() => {
  const state = getState()
  return resetWalletPreparation(state)
})
