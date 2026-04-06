import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { getApiBaseUrl } from '../auth/config'
import { useAuth } from '../auth/useAuth'
import '../App.css'

function oauthErrorMessage(code: string | null): string | null {
  if (!code) return null
  const map: Record<string, string> = {
    oauth_state: 'That sign-in link expired or was invalid. Please try again.',
    oauth_failed: 'Sign-in with the provider failed. Please try again.',
    oauth_not_configured:
      'That sign-in method is not available on this server.',
    oauth_profile: 'Could not load your profile from the provider.',
    oauth_email: 'Could not read your email from the provider.',
  }
  return map[code] ?? 'Sign-in failed. Please try again.'
}

export function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
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
  const [oauthProviders, setOauthProviders] = useState<{
    google: boolean
  } | null>(null)

  const urlError = useMemo(
    () => oauthErrorMessage(searchParams.get('error')),
    [searchParams],
  )

  useEffect(() => {
    const base = getApiBaseUrl()
    if (!base) return
    void fetch(`${base}/auth/oauth/providers`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && typeof data === 'object' && 'google' in data) {
          setOauthProviders({
            google: Boolean((data as { google?: boolean }).google),
          })
        } else {
          setOauthProviders({ google: false })
        }
      })
      .catch(() => setOauthProviders({ google: false }))
  }, [])

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

  const displayError = submitError ?? sessionError ?? urlError
  const base = getApiBaseUrl()
  const showOauth = oauthProviders && base && oauthProviders.google

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
        {showOauth ? (
          <div className="login-oauth" aria-label="Social sign-in">
            {oauthProviders.google ? (
              <a
                className="btn login-oauth-google"
                href={`${base}/auth/oauth/google`}
              >
                Continue with Google
              </a>
            ) : null}
          </div>
        ) : null}
        {showOauth ? (
          <p className="login-oauth-divider" role="presentation">
            <span>or</span>
          </p>
        ) : null}
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
