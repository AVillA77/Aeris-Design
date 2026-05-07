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
  getAll: (params = {}) =>
    api.get<{ data: Transaction[]; total: number; page: number; limit: number }>('/transactions', { params }),
  create: (payload: TransactionPayload) =>
    api.post<Transaction>('/transactions', payload),
  update: (id: string, payload: Partial<TransactionPayload>) =>
    api.put<Transaction>(`/transactions/${id}`, payload),
  delete: (id: string) =>
    api.delete(`/transactions/${id}`),
}
