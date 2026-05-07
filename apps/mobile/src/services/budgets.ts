import { api } from './api'

export interface Budget {
  id: string
  limit_amount: number
  period: 'monthly' | 'yearly'
  category_id: string
  category_name: string
  category_color: string
  spent: number
  remaining: number
}

export const budgetsService = {
  getAll: () => api.get<Budget[]>('/budgets'),
  create: (payload: { categoryId: string; limitAmount: number; period: 'monthly' | 'yearly' }) =>
    api.post<Budget>('/budgets', payload),
  update: (id: string, payload: { limitAmount?: number; period?: 'monthly' | 'yearly' }) =>
    api.put<Budget>(`/budgets/${id}`, payload),
  delete: (id: string) => api.delete(`/budgets/${id}`),
}
