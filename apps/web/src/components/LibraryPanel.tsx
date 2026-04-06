import type { HttpMethod, HttpRequestFields } from '../lib/http'
import { HTTP_METHODS } from '../lib/http'
import type { HistoryRow } from '../api/squawkData'

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
  history: HistoryRow[]
  onApplyRequest: (fields: HttpRequestFields) => void
}

export function LibraryPanel({ history, onApplyRequest }: LibraryPanelProps) {
  const applyHistory = (row: HistoryRow) => {
    const method: HttpMethod = isHttpMethod(row.method) ? row.method : 'GET'
    onApplyRequest({
      method,
      url: row.url,
      headers: row.requestHeaders,
      body: row.requestBody,
    })
  }

  return (
    <section className="library-panel panel" aria-labelledby="library-heading">
      <h2 id="library-heading" className="panel__title">
        History
      </h2>
      <p className="library-intro muted">
        Reopen a past request from your account. Send requests to add entries.
      </p>
      {history.length === 0 ? (
        <p className="muted library-empty">No history yet.</p>
      ) : (
        <ul className="library-list library-list--history">
          {history.map((row) => (
            <li key={row.id}>
              <button
                type="button"
                className="library-item__main library-item__history"
                onClick={() => applyHistory(row)}
              >
                <span className="library-hist-method">{row.method}</span>{' '}
                <span className="library-hist-url">{truncateUrl(row.url)}</span>
                <span className="library-hist-meta muted">
                  {formatHistoryMeta(row)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
