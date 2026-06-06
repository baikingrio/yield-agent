import { getState } from '../../../utils/demo-store'
import { detectBootstrapMode, syncPreparationFromCawCli } from '../../../utils/caw-wallet-bootstrap'
import { syncFundingFromExistingBalance } from '../../../utils/cobo-preparation'
import { getWalletPreparation } from '../../../utils/wallet-preparation'

export default defineEventHandler(async () => {
  const state = getState()
  const prep = state.walletPreparation

  if (
    prep.steps.eoa === 'completed'
    && !prep.agentWallet.coboWalletId
    && !prep.agentWallet.created
  ) {
    try {
      const mode = await detectBootstrapMode()
      if (mode === 'cli-onboard') {
        await syncPreparationFromCawCli(state)
      }
    } catch {
      // No onboarded CLI wallet to restore.
    }
  }

  await syncFundingFromExistingBalance(state)
  return getWalletPreparation(state)
})
