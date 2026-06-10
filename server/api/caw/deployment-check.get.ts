import { getState } from '../../utils/app-store'
import { buildCawDeploymentCheck } from '../../utils/caw-deployment-check'
import { checkTssReadiness } from '../../utils/caw-tss-readiness'
import { getWalletStatusFromSdk } from '../../utils/caw-sdk-wallet'
import { isCoboConfigured } from '../../utils/cobo-client'

export default defineEventHandler(async () => {
  const state = getState()
  const walletId = state.walletPreparation.agentWallet.coboWalletId

  let tssOnline: boolean | null = null
  let boundTssNodeId: string | null = null
  let walletStatus: string | null = null

  if (walletId && isCoboConfigured(state)) {
    const tss = await checkTssReadiness(state, walletId)
    tssOnline = tss.online
    boundTssNodeId = tss.nodeId
    walletStatus = await getWalletStatusFromSdk(state, walletId)
  }

  return buildCawDeploymentCheck(state, { tssOnline, boundTssNodeId, walletStatus })
})
