const pactCredentialCache = new Map<string, string>()
let postgresHydrated = false

export function getPactCredentialFromCache(pactId: string): string | null {
  return pactCredentialCache.get(pactId)?.trim() || null
}

export function setPactCredentialInCache(pactId: string, apiKey: string): void {
  pactCredentialCache.set(pactId, apiKey.trim())
}

export function deletePactCredentialFromCache(pactId: string): void {
  pactCredentialCache.delete(pactId)
}

export function loadPactCredentialCache(entries: Array<{ pactId: string, apiKey: string }>): void {
  pactCredentialCache.clear()
  for (const entry of entries) {
    const key = entry.apiKey.trim()
    if (key) pactCredentialCache.set(entry.pactId, key)
  }
}

export function clearPactCredentialCache(): void {
  pactCredentialCache.clear()
}

export function isPostgresHydrated(): boolean {
  return postgresHydrated
}

export function setPostgresHydrated(value: boolean): void {
  postgresHydrated = value
}

export function resetRepositoryRuntimeState(): void {
  pactCredentialCache.clear()
  postgresHydrated = false
}
