import axios from 'axios'
import { API_URL } from './api'

const base = axios.create({ baseURL: API_URL })

export const authService = {
  login: (email: string, password: string) =>
    base.post<{ user: { id: string; email: string; name: string; role: string }; accessToken: string; refreshToken: string }>(
      '/auth/login', { email, password }
    ),
  register: (name: string, email: string, password: string) =>
    base.post<{ user: { id: string; email: string; name: string; role: string }; accessToken: string; refreshToken: string }>(
      '/auth/register', { name, email, password }
    ),
  logout: (refreshToken: string) =>
    base.post('/auth/logout', { refreshToken }),
}
