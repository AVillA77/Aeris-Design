export const toNum = (v: unknown): number => {
  if (typeof v === 'number') return v
  const n = parseFloat(String(v))
  return isNaN(n) ? 0 : n
}

export const fmt = (v: unknown): string => toNum(v).toFixed(2)

export const pct = (value: unknown, total: unknown): number => {
  const t = toNum(total)
  return t > 0 ? Math.min((toNum(value) / t) * 100, 100) : 0
}
