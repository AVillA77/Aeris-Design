import { create } from 'zustand'
import type { Transaction } from '@aeris/shared'

interface TransactionStore {
  transactions: Transaction[]
  loading: boolean
  error: string | null
  fetchTransactions: () => Promise<void>
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updateTransaction: (id: string, transaction: Partial<Transaction>) => Promise<void>
  deleteTransaction: (id: string) => Promise<void>
}

export const useTransactionStore = create<TransactionStore>((set) => ({
  transactions: [],
  loading: false,
  error: null,
  fetchTransactions: async () => {
    set({ loading: true, error: null })
    try {
      // TODO: Implement fetch from API
      set({ loading: false })
    } catch (error) {
      set({ error: 'Failed to fetch transactions', loading: false })
    }
  },
  addTransaction: async (transaction) => {
    // TODO: Implement add transaction
  },
  updateTransaction: async (id, transaction) => {
    // TODO: Implement update transaction
  },
  deleteTransaction: async (id) => {
    // TODO: Implement delete transaction
  },
}))
