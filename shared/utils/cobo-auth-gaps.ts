export function isPactScopedWalletAuthGap(message: string | null | undefined): boolean {
  if (!message?.trim()) return false
  const normalized = message.toLowerCase()
  return normalized.includes('api key pact authorization')
    || normalized.includes('pact authorization is not authorized')
    || (normalized.includes('agent wallet') && normalized.includes('提交 pact'))
}
