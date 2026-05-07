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

export interface BudgetPayload {
  categoryId: string
  limitAmount: number
  period: 'monthly' | 'yearly'
}

export const budgetsService = {
  getAll: () => api.get<Budget[]>('/budgets'),
  create: (payload: BudgetPayload) => api.post<Budget>('/budgets', payload),
  update: (id: string, payload: Partial<BudgetPayload>) => api.put<Budget>(`/budgets/${id}`, payload),
  delete: (id: string) => api.delete(`/budgets/${id}`),
}
