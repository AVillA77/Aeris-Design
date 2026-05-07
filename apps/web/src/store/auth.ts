import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authService } from '../services/auth'

interface User {
  id: string
  email: string
  name: string
  role: string
}

interface AuthStore {
  isAuthenticated: boolean
  user: User | null
  token: string | null
  refreshToken: string | null
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
  setToken: (token: string | null) => void
  setUser: (user: Partial<User>) => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      user: null,
      token: null,
      refreshToken: null,

      login: async (email, password) => {
        const { data } = await authService.login(email, password)
        set({
          isAuthenticated: true,
          user: data.user,
          token: data.accessToken,
          refreshToken: data.refreshToken,
        })
      },

      register: async (name, email, password) => {
        const { data } = await authService.register(name, email, password)
        set({
          isAuthenticated: true,
          user: data.user,
          token: data.accessToken,
          refreshToken: data.refreshToken,
        })
      },

      logout: async () => {
        const rt = get().refreshToken
        if (rt) authService.logout(rt).catch(() => {})
        set({ isAuthenticated: false, user: null, token: null, refreshToken: null })
      },

      setToken: (token) => set({ token }),
      setUser: (updates) => set((s) => ({ user: s.user ? { ...s.user, ...updates } : null })),
    }),
    { name: 'aeris-auth' }
  )
)
