import { useState, type FormEvent } from 'react'
import { useAuth } from '../auth/useAuth'

export function AuthPanel() {
  const {
    user,
    loading,
    error: sessionError,
    configured,
    register,
    login,
    logout,
    clearError,
  } = useAuth()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  if (!configured) {
    return (
      <p className="auth-hint muted" title="Set VITE_API_URL in apps/web/.env">
        API URL not set (auth disabled)
      </p>
    )
  }

  if (loading) {
    return <p className="muted auth-hint">Loading session…</p>
  }

  if (user) {
    return (
      <div className="auth-bar">
        <span className="auth-email" title={user.email}>
          {user.email}
        </span>
        <button
          type="button"
          className="btn btn--ghost"
          onClick={() => {
            void (async () => {
              setBusy(true)
              try {
                await logout()
              } finally {
                setBusy(false)
              }
            })()
          }}
          disabled={busy}
        >
          {busy ? '…' : 'Sign out'}
        </button>
      </div>
    )
  }

  const displayError = submitError ?? sessionError

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    clearError()
    setSubmitError(null)
    void (async () => {
      setBusy(true)
      try {
        if (mode === 'register') {
          await register(email, password)
        } else {
          await login(email, password)
        }
        setEmail('')
        setPassword('')
      } catch (err) {
        setSubmitError(
          err instanceof Error ? err.message : 'Something went wrong',
        )
      } finally {
        setBusy(false)
      }
    })()
  }

  return (
    <form className="auth-panel" onSubmit={onSubmit} aria-label="Account">
      <div className="auth-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          className={`auth-tab ${mode === 'login' ? 'is-active' : ''}`}
          aria-selected={mode === 'login'}
          onClick={() => {
            setMode('login')
            clearError()
            setSubmitError(null)
          }}
        >
          Log in
        </button>
        <button
          type="button"
          role="tab"
          className={`auth-tab ${mode === 'register' ? 'is-active' : ''}`}
          aria-selected={mode === 'register'}
          onClick={() => {
            setMode('register')
            clearError()
            setSubmitError(null)
          }}
        >
          Register
        </button>
      </div>
      <div className="auth-fields">
        <label className="sr-only" htmlFor="auth-email">
          Email
        </label>
        <input
          id="auth-email"
          className="input auth-input"
          type="email"
          autoComplete="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <label className="sr-only" htmlFor="auth-password">
          Password
        </label>
        <input
          id="auth-password"
          className="input auth-input"
          type="password"
          autoComplete={
            mode === 'register' ? 'new-password' : 'current-password'
          }
          placeholder="Password (8+ chars)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          required
        />
        <button
          type="submit"
          className="btn btn--primary auth-submit"
          disabled={busy}
        >
          {busy ? '…' : mode === 'register' ? 'Create account' : 'Sign in'}
        </button>
      </div>
      {displayError ? (
        <p className="auth-error" role="alert">
          {displayError}
        </p>
      ) : null}
    </form>
  )
}
