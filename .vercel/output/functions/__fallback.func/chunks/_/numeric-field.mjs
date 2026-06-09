function parseNumericField(value) {
  if (value === void 0 || value === null) return null;
  const cleaned = String(value).trim().replace(/%+$/u, "").replace(/,/gu, "");
  if (!cleaned) return null;
  const num = Number(cleaned);
  return Number.isNaN(num) ? null : num;
}
function normalizeNumericField(value, fallback) {
  const num = parseNumericField(value);
  return num === null ? fallback : String(num);
}

export { normalizeNumericField as n, parseNumericField as p };
//# sourceMappingURL=numeric-field.mjs.map
