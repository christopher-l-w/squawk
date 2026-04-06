import { useState } from 'react'
import type { HttpMethod, HttpRequestFields } from '../lib/http'
import { HTTP_METHODS } from '../lib/http'
import type { HistoryRow, SavedRequestRow } from '../api/squawkData'

function isHttpMethod(m: string): m is HttpMethod {
  return (HTTP_METHODS as readonly string[]).includes(m)
}

function truncateUrl(url: string, max = 48): string {
  if (url.length <= max) return url
  return `${url.slice(0, max - 1)}…`
}

function formatHistoryMeta(row: HistoryRow): string {
  if (row.errorMessage) return row.errorMessage
  if (row.statusCode != null && row.durationMs != null) {
    return `${row.statusCode} · ${row.durationMs} ms`
  }
  return '—'
}

interface LibraryPanelProps {
  saved: SavedRequestRow[]
  history: HistoryRow[]
  onApplyRequest: (fields: HttpRequestFields) => void
  onSave: (name: string) => Promise<void>
  onDeleteSaved: (id: string) => Promise<void>
}

export function LibraryPanel({
  saved,
  history,
  onApplyRequest,
  onSave,
  onDeleteSaved,
}: LibraryPanelProps) {
  const [saveName, setSaveName] = useState('')
  const [busy, setBusy] = useState(false)

  const applySaved = (row: SavedRequestRow) => {
    const method: HttpMethod = isHttpMethod(row.method) ? row.method : 'GET'
    onApplyRequest({
      method,
      url: row.url,
      headers: row.headers,
      body: row.body,
    })
  }

  const applyHistory = (row: HistoryRow) => {
    const method: HttpMethod = isHttpMethod(row.method) ? row.method : 'GET'
    onApplyRequest({
      method,
      url: row.url,
      headers: row.requestHeaders,
      body: row.requestBody,
    })
  }

  const handleSave = () => {
    const name = saveName.trim()
    if (!name) return
    void (async () => {
      setBusy(true)
      try {
        await onSave(name)
        setSaveName('')
      } finally {
        setBusy(false)
      }
    })()
  }

  return (
    <section className="library-panel panel" aria-labelledby="library-heading">
      <h2 id="library-heading" className="panel__title">
        Library
      </h2>
      <p className="library-intro muted">
        Save the current request or reopen a past run. Data is stored for your
        account only.
      </p>
      <div className="library-grid">
        <div className="library-column">
          <h3 className="library-subtitle">Saved</h3>
          <div className="library-save-row">
            <label className="sr-only" htmlFor="save-request-name">
              Save as
            </label>
            <input
              id="save-request-name"
              className="input library-input"
              placeholder="Name this request"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              maxLength={255}
            />
            <button
              type="button"
              className="btn btn--primary"
              disabled={busy || !saveName.trim()}
              onClick={handleSave}
            >
              Save
            </button>
          </div>
          {saved.length === 0 ? (
            <p className="muted library-empty">No saved requests yet.</p>
          ) : (
            <ul className="library-list">
              {saved.map((row) => (
                <li key={row.id} className="library-item">
                  <button
                    type="button"
                    className="library-item__main"
                    onClick={() => applySaved(row)}
                  >
                    {row.name}
                  </button>
                  <button
                    type="button"
                    className="btn btn--ghost library-item__delete"
                    aria-label={`Delete ${row.name}`}
                    onClick={() => void onDeleteSaved(row.id)}
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="library-column">
          <h3 className="library-subtitle">History</h3>
          {history.length === 0 ? (
            <p className="muted library-empty">
              Send a request to build history.
            </p>
          ) : (
            <ul className="library-list">
              {history.map((row) => (
                <li key={row.id}>
                  <button
                    type="button"
                    className="library-item__main library-item__history"
                    onClick={() => applyHistory(row)}
                  >
                    <span className="library-hist-method">{row.method}</span>{' '}
                    <span className="library-hist-url">
                      {truncateUrl(row.url)}
                    </span>
                    <span className="library-hist-meta muted">
                      {formatHistoryMeta(row)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  )
}
