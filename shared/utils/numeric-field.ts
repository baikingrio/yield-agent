export function parseNumericField(value: string | number | undefined | null): number | null {
  if (value === undefined || value === null) return null
  const cleaned = String(value).trim().replace(/%+$/u, '').replace(/,/gu, '')
  if (!cleaned) return null
  const num = Number(cleaned)
  return Number.isNaN(num) ? null : num
}

export function normalizeNumericField(
  value: string | number | undefined | null,
  fallback: string,
): string {
  const num = parseNumericField(value)
  return num === null ? fallback : String(num)
}
