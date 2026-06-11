import type { WalletPreparation } from '../types/app'
import { DASHBOARD_HOME } from '../constants/dashboard-routes'

export interface DashboardAccessInput {
  preparation: WalletPreparation | null | undefined
  browserWalletConnected: boolean
}

export interface LandingCta {
  label: string
  href: string
}

export function canEnterDashboard(input: DashboardAccessInput): boolean {
  const prep = input.preparation
  return Boolean(
    input.browserWalletConnected
    || prep?.ready
    || prep?.eoa.connected,
  )
}

export function landingPrimaryCta(_input: { preparation: WalletPreparation | null | undefined }): LandingCta {
  return {
    label: '进入 Demo',
    href: DASHBOARD_HOME,
  }
}
