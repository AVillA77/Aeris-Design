import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

export const CURRENCIES = {
  USD: { symbol: '$', name: 'Dólar USD' },
  EUR: { symbol: '€', name: 'Euro' },
  ARS: { symbol: '$', name: 'Peso Arg.' },
  MXN: { symbol: '$', name: 'Peso Mex.' },
  CLP: { symbol: '$', name: 'Peso Chi.' },
  COP: { symbol: '$', name: 'Peso Col.' },
  BRL: { symbol: 'R$', name: 'Real BRL' },
  GBP: { symbol: '£', name: 'Libra GBP' },
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
    {
      name: 'aeris-prefs',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)
