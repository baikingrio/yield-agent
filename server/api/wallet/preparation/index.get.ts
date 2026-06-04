import { getState } from '../../../utils/demo-store'
import { getWalletPreparation } from '../../../utils/wallet-preparation'

export default defineEventHandler(() => {
  return getWalletPreparation(getState())
})
