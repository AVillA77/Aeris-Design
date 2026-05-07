import { api } from './api'

export interface Category {
  id: string
  name: string
  color: string
  transaction_count: number
  total_expenses: number
}

export const categoriesService = {
  getAll: () => api.get<Category[]>('/categories'),
  create: (payload: { name: string; color: string }) => api.post<Category>('/categories', payload),
  update: (id: string, payload: { name?: string; color?: string }) => api.put<Category>(`/categories/${id}`, payload),
  delete: (id: string) => api.delete(`/categories/${id}`),
}
