import { useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import '../App.css'

export function AccountPage() {
  const navigate = useNavigate()
  const {
    user,
    loading,
    configured,
    updateProfile,
    deleteAccount,
    clearError,
    error: sessionError,
  } = useAuth()
  const [displayName, setDisplayName] = useState('')
  const [busy, setBusy] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteBusy, setDeleteBusy] = useState(false)

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName ?? '')
    }
  }, [user])

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

  if (!user) {
    return <Navigate to="/login" replace />
  }

  const displayError = submitError ?? sessionError

  const onSave = (e: FormEvent) => {
    e.preventDefault()
    clearError()
    setSubmitError(null)
    void (async () => {
      setBusy(true)
      try {
        const trimmed = displayName.trim()
        await updateProfile(trimmed === '' ? null : trimmed)
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

  const onDelete = () => {
    void (async () => {
      setDeleteBusy(true)
      try {
        await deleteAccount()
        navigate('/', { replace: true })
      } catch (err) {
        setSubmitError(
          err instanceof Error ? err.message : 'Something went wrong',
        )
      } finally {
        setDeleteBusy(false)
        setDeleteOpen(false)
      }
    })()
  }

  return (
    <div className="login-page">
      <div className="login-page__card panel account-page">
        <Link to="/" className="login-page__back">
          ← Back to app
        </Link>
        <h1 className="login-page__title">Account</h1>
        <p className="login-page__subtitle muted">
          Update how your name appears in the app. Email is from your sign-in
          provider and cannot be changed here.
        </p>

        <form
          className="login-page__form auth-panel account-page__form"
          onSubmit={onSave}
          aria-label="Profile"
        >
          <div className="auth-fields login-page__fields account-page__fields">
            <label className="account-page__label" htmlFor="account-email">
              Email
            </label>
            <input
              id="account-email"
              className="input auth-input"
              type="email"
              value={user.email}
              readOnly
              disabled
              autoComplete="off"
            />
            <label className="account-page__label" htmlFor="account-name">
              Display name
            </label>
            <input
              id="account-name"
              className="input auth-input"
              type="text"
              autoComplete="name"
              placeholder="Your name"
              maxLength={255}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
            <button
              type="submit"
              className="btn btn--primary auth-submit login-page__submit"
              disabled={busy}
            >
              {busy ? '…' : 'Save'}
            </button>
          </div>
          {displayError ? (
            <p className="auth-error" role="alert">
              {displayError}
            </p>
          ) : null}
        </form>

        <section className="account-page__danger" aria-labelledby="danger-heading">
          <h2 id="danger-heading" className="account-page__danger-title">
            Delete account
          </h2>
          <p className="muted account-page__danger-text">
            Permanently delete your account, saved requests, and history. This
            cannot be undone.
          </p>
          {!deleteOpen ? (
            <button
              type="button"
              className="btn account-page__delete-btn"
              onClick={() => {
                clearError()
                setSubmitError(null)
                setDeleteOpen(true)
              }}
            >
              Delete my account…
            </button>
          ) : (
            <div className="account-page__delete-confirm">
              <button
                type="button"
                className="btn btn--ghost"
                disabled={deleteBusy}
                onClick={() => setDeleteOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn account-page__delete-btn"
                disabled={deleteBusy}
                onClick={onDelete}
              >
                {deleteBusy ? '…' : 'Delete forever'}
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
