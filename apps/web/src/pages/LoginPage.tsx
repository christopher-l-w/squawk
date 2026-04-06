import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import '../App.css'

export function LoginPage() {
  const navigate = useNavigate()
  const {
    user,
    loading,
    error: sessionError,
    configured,
    register,
    login,
    clearError,
  } = useAuth()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  if (!configured) {
    return (
      <div className="login-page">
        <div className="login-page__card panel">
          <p className="muted" title="Set VITE_API_URL in apps/web/.env">
            API URL is not set; authentication is disabled.
          </p>
          <Link to="/" className="login-page__back">
            Back to app
          </Link>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="login-page">
        <p className="muted login-page__loading">Loading session…</p>
      </div>
    )
  }

  if (user) {
    return <Navigate to="/" replace />
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
        navigate('/', { replace: true })
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
    <div className="login-page">
      <div className="login-page__card panel">
        <Link to="/" className="login-page__back">
          ← Back to app
        </Link>
        <h1 className="login-page__title">Squawk</h1>
        <p className="login-page__subtitle muted">
          Sign in to sync saved requests and history.
        </p>
        <form
          className="login-page__form auth-panel login-page__auth"
          onSubmit={onSubmit}
          aria-label="Account"
        >
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
          <div className="auth-fields login-page__fields">
            <label className="sr-only" htmlFor="login-email">
              Email
            </label>
            <input
              id="login-email"
              className="input auth-input"
              type="email"
              autoComplete="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <label className="sr-only" htmlFor="login-password">
              Password
            </label>
            <input
              id="login-password"
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
              className="btn btn--primary auth-submit login-page__submit"
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
      </div>
    </div>
  )
}
