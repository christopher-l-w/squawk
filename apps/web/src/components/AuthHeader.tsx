import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'

export function AuthHeader() {
  const { user, loading, configured, logout } = useAuth()
  const [busy, setBusy] = useState(false)

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
    const label =
      user.displayName?.trim() && user.displayName.trim().length > 0
        ? user.displayName.trim()
        : user.email
    return (
      <div className="auth-bar">
        <span className="auth-email" title={user.email}>
          {label}
        </span>
        <Link to="/account" className="btn btn--ghost auth-account">
          Account
        </Link>
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

  return (
    <Link to="/login" className="btn btn--ghost auth-sign-in">
      Sign in
    </Link>
  )
}
