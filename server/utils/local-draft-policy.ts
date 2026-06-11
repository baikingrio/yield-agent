import type { AppState } from '../../shared/types/app'

export function isLocalDraftAllowed(state: AppState): boolean {
  return state.settings.developerMode === true
    || state.walletPreparation.demoMode === 'preset'
    || process.env.CAW_FORCE_LOCAL_DRAFT === 'true'
}
