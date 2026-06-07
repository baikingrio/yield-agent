import { formatEther } from 'viem'
import { getState } from '../../../utils/demo-store'
import {
  FAUCET_HINTS,
  MIN_NATIVE_ETH,
  NATIVE_TOKEN_LABELS,
  NETWORK_LABELS,
  RECOMMENDED_FUND_ETH,
  detectWrongChainGasHint,
  getAgentNativeEthBalance,
  hasEnoughAgentGas,
} from '../../../utils/agent-gas'

export default defineEventHandler(async () => {
  const prep = getState().walletPreparation
  const address = prep.agentWallet.address
  if (!address) {
    throw createError({ statusCode: 400, data: { error: 'Agent Wallet 未就绪' } })
  }

  const balance = await getAgentNativeEthBalance(prep.network, address as `0x${string}`)
  const wrongChainHint = await detectWrongChainGasHint(prep.network, address as `0x${string}`, balance)

  return {
    network: prep.network,
    networkLabel: NETWORK_LABELS[prep.network],
    nativeTokenLabel: NATIVE_TOKEN_LABELS[prep.network],
    agentAddress: address,
    ethBalance: formatEther(balance),
    ready: hasEnoughAgentGas(balance),
    minEth: MIN_NATIVE_ETH,
    recommendedFundEth: RECOMMENDED_FUND_ETH,
    faucetUrl: FAUCET_HINTS[prep.network],
    wrongChainHint,
  }
})
