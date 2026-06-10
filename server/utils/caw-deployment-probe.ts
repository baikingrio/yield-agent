import type { AppState } from '../../shared/types/app'
import type { CawDeploymentProbe } from './caw-deployment-check'
import { checkTssReadiness } from './caw-tss-readiness'
import { getWalletStatusFromSdk } from './caw-sdk-wallet'
import { isCoboConfigured } from './cobo-client'

const EMPTY_PROBE: CawDeploymentProbe = {
  tssOnline: null,
  boundTssNodeId: null,
  walletStatus: null,
}

export async function probeCawDeployment(state: AppState): Promise<CawDeploymentProbe> {
  const walletId = state.walletPreparation.agentWallet.coboWalletId
  if (!walletId || !isCoboConfigured(state)) {
    return EMPTY_PROBE
  }

  const [tss, walletStatus] = await Promise.all([
    checkTssReadiness(state, walletId),
    getWalletStatusFromSdk(state, walletId),
  ])

  return {
    tssOnline: tss.online,
    boundTssNodeId: tss.nodeId,
    walletStatus,
  }
}
