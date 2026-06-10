import { getState } from '../utils/app-store'
import { syncWalletSummaryFromCobo } from '../utils/cobo-preparation'

export default defineEventHandler(async (event) => {
  const state = getState()
  if (getQuery(event).sync === 'true') {
    await syncWalletSummaryFromCobo(state)
  }
  return state.wallet
})
