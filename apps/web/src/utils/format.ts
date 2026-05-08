import { usePrefsStore, CURRENCIES } from '../store/prefs'

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

export function useCurrencySymbol(): string {
  const currency = usePrefsStore((s) => s.currency)
  return CURRENCIES[currency].symbol
}

export function formatMoney(v: unknown): string {
  const currency = usePrefsStore.getState().currency
  const { symbol } = CURRENCIES[currency]
  return `${symbol}${toNum(v).toFixed(2)}`
}
