import { api } from './api'

export interface Category {
  id: string
  name: string
  color: string
  icon?: string
  transaction_count: number
  total_expenses: number
}

export interface CategoryPayload {
  name: string
  color: string
  icon?: string
}

export const categoriesService = {
  getAll: () => api.get<Category[]>('/categories'),
  create: (payload: CategoryPayload) => api.post<Category>('/categories', payload),
  update: (id: string, payload: Partial<CategoryPayload>) => api.put<Category>(`/categories/${id}`, payload),
  delete: (id: string) => api.delete(`/categories/${id}`),
}
