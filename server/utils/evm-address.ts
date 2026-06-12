const EVM_ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/

export function isValidEvmAddress(address: string | null | undefined): address is string {
  return Boolean(address?.trim() && EVM_ADDRESS_RE.test(address.trim()))
}

export function normalizeEvmAddress(address: string): string {
  return address.trim()
}
