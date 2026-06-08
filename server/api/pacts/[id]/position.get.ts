import { getState } from '../../../utils/app-store'
import { getNetworkChainConfig } from '../../../utils/cobo-config'
import { fetchYieldPositionSnapshot } from '../../../utils/yield-position'
import { findPactById } from '../../../utils/pact-lookup'
import type { NetworkId } from '../../../../shared/types/app'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, data: { error: '缺少 Pact ID' } })
  }

  const state = getState()
  const pact = findPactById(state, id)
  if (!pact) {
    throw createError({ statusCode: 404, data: { error: 'Pact not found' } })
  }

  const walletAddress = state.walletPreparation.agentWallet.address
  if (!walletAddress) {
    throw createError({ statusCode: 400, data: { error: 'Agent Wallet 未就绪' } })
  }

  const strategy = state.strategies.find((item) => item.id === pact.strategyId)
  const network = (strategy?.network ?? state.walletPreparation.network) as NetworkId
  const chainConfig = getNetworkChainConfig(network)
  const position = await fetchYieldPositionSnapshot(network, chainConfig, walletAddress)

  return {
    pactId: pact.id,
    status: pact.status,
    firstExecutionCompleted: Boolean(pact.firstExecutionCompleted && pact.firstExecutionTxHash),
    redeemCompleted: Boolean(pact.redeemCompleted && pact.redeemTxHash),
    ...position,
  }
})
