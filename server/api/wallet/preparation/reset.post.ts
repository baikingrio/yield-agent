import { flushCurrentState, getState } from '../../../utils/app-store'
import { resetWalletPreparation } from '../../../utils/wallet-preparation'

export default defineEventHandler(() => {
  const state = getState()
  const hadCoboWallet = Boolean(state.walletPreparation.agentWallet.coboWalletId)
  const preparation = resetWalletPreparation(state)
  flushCurrentState()
  return {
    preparation,
    warning: hadCoboWallet
      ? '已重置本应用准备进度。CAW App 中已创建的 Agent 钱包不会自动删除，未激活的 YieldAgent 钱包请在 CAW App 中手动忽略。'
      : null,
  }
})
