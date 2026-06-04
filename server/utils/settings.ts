import type { DemoSettings } from '../../../shared/types/demo'

export function toPublicSettings(settings: DemoSettings): Omit<DemoSettings, 'coboApiKey'> {
  const { coboApiKey: _key, ...publicSettings } = settings
  return publicSettings
}
