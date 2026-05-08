import { api } from './api'

export interface Goal {
  id: string
  name: string
  target: number
  saved: number
  color: string
  deadline: string | null
  user_id: string
  created_at: string
  updated_at: string
}

export interface GoalPayload {
  name: string
  target: number
  saved?: number
  color?: string
  deadline?: string
}

export const goalsService = {
  getAll: () => api.get<Goal[]>('/goals'),
  create: (data: GoalPayload) => api.post<Goal>('/goals', data),
  update: (id: string, data: Partial<GoalPayload>) => api.put<Goal>(`/goals/${id}`, data),
  delete: (id: string) => api.delete(`/goals/${id}`),
}
