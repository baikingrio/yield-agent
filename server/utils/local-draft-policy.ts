import type { AppState } from '../../shared/types/app'

export function isLocalDraftAllowed(_state: AppState): boolean {
  return process.env.CAW_FORCE_LOCAL_DRAFT === 'true'
}
