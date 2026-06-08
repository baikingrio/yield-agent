import { getState } from '../utils/app-store'
import { syncWalletSummaryFromCobo } from '../utils/cobo-preparation'

export default defineEventHandler(async () => {
  const state = getState()
  await syncWalletSummaryFromCobo(state)
  return state.wallet
})
