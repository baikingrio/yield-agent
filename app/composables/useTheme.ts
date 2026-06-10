export type ThemePreference = 'light' | 'dark' | 'system'

export const THEME_STORAGE_KEY = 'yieldagent-theme'

export const THEME_OPTIONS: { value: ThemePreference; label: string; hint: string }[] = [
  { value: 'light', label: '浅色', hint: '浅色背景，适合明亮环境' },
  { value: 'dark', label: '深色', hint: '深色控制台主题' },
  { value: 'system', label: '跟随系统', hint: '默认：随操作系统外观切换' },
]

export function resolveThemePreference(preference: ThemePreference): 'light' | 'dark' {
  if (preference !== 'system') return preference
  if (import.meta.client) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return 'dark'
}

export function applyTheme(resolved: 'light' | 'dark') {
  if (!import.meta.client) return
  document.documentElement.dataset.theme = resolved
  document.documentElement.style.colorScheme = resolved
}

export function readThemeColor(token: string, fallback: string): string {
  if (!import.meta.client) return fallback
  const value = getComputedStyle(document.documentElement).getPropertyValue(token).trim()
  return value || fallback
}

export function useTheme() {
  const preference = useState<ThemePreference>('theme-preference', () => 'system')
  const resolved = computed(() => resolveThemePreference(preference.value))

  function setPreference(next: ThemePreference) {
    preference.value = next
    if (import.meta.client) {
      localStorage.setItem(THEME_STORAGE_KEY, next)
      applyTheme(resolveThemePreference(next))
    }
  }

  function toggleLightDark() {
    setPreference(resolved.value === 'dark' ? 'light' : 'dark')
  }

  function initTheme() {
    if (!import.meta.client) return

    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      preference.value = stored
    }

    applyTheme(resolveThemePreference(preference.value))

    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onSystemChange = () => {
      if (preference.value === 'system') {
        applyTheme(resolveThemePreference('system'))
      }
    }
    mq.addEventListener('change', onSystemChange)
    onScopeDispose(() => mq.removeEventListener('change', onSystemChange))
  }

  watch(resolved, (value) => applyTheme(value))

  return {
    preference,
    resolved,
    setPreference,
    toggleLightDark,
    initTheme,
  }
}
