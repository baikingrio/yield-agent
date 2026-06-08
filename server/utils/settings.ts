import type { AppSettings } from '../../../shared/types/app'

export function toPublicSettings(settings: AppSettings): Omit<AppSettings, 'coboApiKey'> {
  const { coboApiKey: _key, ...publicSettings } = settings
  return {
    ...publicSettings,
    apiKeyConfigured: publicSettings.apiKeyConfigured || Boolean(process.env.AGENT_WALLET_API_KEY?.trim()),
  }
}
