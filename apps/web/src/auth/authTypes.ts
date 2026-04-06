import type { AuthUser } from './authApi'

export type AuthContextValue = {
  user: AuthUser | null
  loading: boolean
  error: string | null
  configured: boolean
  refresh: () => Promise<void>
  register: (email: string, password: string) => Promise<void>
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  updateProfile: (displayName: string | null) => Promise<void>
  deleteAccount: () => Promise<void>
  clearError: () => void
}
