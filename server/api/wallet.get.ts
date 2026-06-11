import { getState, persistCurrentState } from '../utils/app-store'
import { syncWalletSummaryFromCobo } from '../utils/cobo-preparation'
import {
  getPresetDemoWalletConfig,
  hydratePresetDemoWalletFromCobo,
} from '../utils/pacttrader-demo-wallet'

export default defineEventHandler(async (event) => {
  const state = getState()
  if (getQuery(event).sync === 'true') {
    if (getPresetDemoWalletConfig().enabled) {
      await hydratePresetDemoWalletFromCobo(state)
    } else {
      await syncWalletSummaryFromCobo(state)
    }
    persistCurrentState()
  }
  return state.wallet
})
