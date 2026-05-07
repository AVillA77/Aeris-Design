import { api } from './api'

export interface Transaction {
  id: string
  type: 'income' | 'expense'
  amount: number
  description: string
  date: string
  payment_method: 'cash' | 'card' | 'transfer' | 'other'
  category_id: string
  category_name: string
  category_color: string
  created_at: string
}

export interface TransactionFilters {
  page?: number
  limit?: number
  type?: 'income' | 'expense'
  categoryId?: string
  from?: string
  to?: string
}

export interface TransactionPayload {
  type: 'income' | 'expense'
  amount: number
  description: string
  date: string
  paymentMethod: 'cash' | 'card' | 'transfer' | 'other'
  categoryId: string
}

export const transactionsService = {
  getAll: (filters: TransactionFilters = {}) =>
    api.get<{ data: Transaction[]; total: number; page: number; limit: number }>('/transactions', { params: filters }),

  create: (payload: TransactionPayload) =>
    api.post<Transaction>('/transactions', payload),

  update: (id: string, payload: Partial<TransactionPayload>) =>
    api.put<Transaction>(`/transactions/${id}`, payload),

  delete: (id: string) =>
    api.delete(`/transactions/${id}`),
}
