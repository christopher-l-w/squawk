import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  deleteAccountRequest,
  fetchMe,
  loginRequest,
  logoutRequest,
  registerRequest,
  updateProfileRequest,
} from './authApi'
import { AuthContext } from './authContext'
import type { AuthContextValue } from './authTypes'
import { getApiBaseUrl } from './config'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthContextValue['user']>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const configured = Boolean(getApiBaseUrl())

  const refresh = useCallback(async () => {
    if (!getApiBaseUrl()) {
      setUser(null)
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const u = await fetchMe()
      setUser(u)
    } catch (e) {
      setUser(null)
      setError(e instanceof Error ? e.message : 'Failed to load session')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const register = useCallback(async (email: string, password: string) => {
    setError(null)
    const u = await registerRequest(email, password)
    setUser(u)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    setError(null)
    const u = await loginRequest(email, password)
    setUser(u)
  }, [])

  const logout = useCallback(async () => {
    setError(null)
    await logoutRequest()
    setUser(null)
  }, [])

  const updateProfile = useCallback(async (displayName: string | null) => {
    setError(null)
    const u = await updateProfileRequest(displayName)
    setUser(u)
  }, [])

  const deleteAccount = useCallback(async () => {
    setError(null)
    await deleteAccountRequest()
    setUser(null)
  }, [])

  const clearError = useCallback(() => setError(null), [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      error,
      configured,
      refresh,
      register,
      login,
      logout,
      updateProfile,
      deleteAccount,
      clearError,
    }),
    [
      user,
      loading,
      error,
      configured,
      refresh,
      register,
      login,
      logout,
      updateProfile,
      deleteAccount,
      clearError,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
