import { z } from 'zod'
import { MAX_WALLET_OP_USDC, MIN_WALLET_OP_USDC } from '#shared/types/app'
import { getState } from '../../../utils/app-store'
import { getNetworkChainConfig } from '../../../utils/cobo-config'
import { isCoboConfigured } from '../../../utils/cobo-client'

const amountRangeError = `请输入 ${MIN_WALLET_OP_USDC}–${MAX_WALLET_OP_USDC.toLocaleString('en-US')} USDC`

const schema = z.object({
  amountUsdc: z.coerce.number().min(MIN_WALLET_OP_USDC).max(MAX_WALLET_OP_USDC),
})

export default defineEventHandler((event) => {
  const query = getQuery(event)
  const parsed = schema.safeParse(query)

  if (!parsed.success) {
    throw createError({ statusCode: 400, data: { error: amountRangeError } })
  }

  const state = getState()
  const prep = state.walletPreparation

  if (prep.steps.agent_wallet !== 'completed' || !prep.agentWallet.address) {
    throw createError({ statusCode: 400, data: { error: '请先创建 Agent Wallet' } })
  }

  if (!isCoboConfigured(state)) {
    throw createError({ statusCode: 400, data: { error: '请先在设置中配置 Cobo API Key' } })
  }

  const networkConfig = getNetworkChainConfig(prep.network)

  return {
    agentAddress: prep.agentWallet.address,
    usdcContract: networkConfig.usdcContract,
    decimals: networkConfig.usdcDecimals,
    chainId: networkConfig.evmChainId,
    coboChainId: networkConfig.coboChainId,
    coboTokenId: networkConfig.coboTokenId,
    minAmount: parsed.data.amountUsdc,
  }
})
