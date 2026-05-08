import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const CURRENCIES = {
  USD: { symbol: '$', name: 'Dólar USD', locale: 'en-US' },
  EUR: { symbol: '€', name: 'Euro', locale: 'de-DE' },
  ARS: { symbol: '$', name: 'Peso Arg.', locale: 'es-AR' },
  MXN: { symbol: '$', name: 'Peso Mex.', locale: 'es-MX' },
  CLP: { symbol: '$', name: 'Peso Chi.', locale: 'es-CL' },
  COP: { symbol: '$', name: 'Peso Col.', locale: 'es-CO' },
  BRL: { symbol: 'R$', name: 'Real BRL', locale: 'pt-BR' },
  GBP: { symbol: '£', name: 'Libra GBP', locale: 'en-GB' },
} as const

export type CurrencyCode = keyof typeof CURRENCIES

interface PrefsStore {
  currency: CurrencyCode
  setCurrency: (c: CurrencyCode) => void
}

export const usePrefsStore = create<PrefsStore>()(
  persist(
    (set) => ({
      currency: 'USD',
      setCurrency: (currency) => set({ currency }),
    }),
    { name: 'aeris-prefs' }
  )
)
