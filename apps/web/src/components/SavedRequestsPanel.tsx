import type { HttpMethod, HttpRequestFields } from '../lib/http'
import { HTTP_METHODS } from '../lib/http'
import type { SavedRequestRow } from '../api/squawkData'
import { CollapsibleSection } from './CollapsibleSection'

function isHttpMethod(m: string): m is HttpMethod {
  return (HTTP_METHODS as readonly string[]).includes(m)
}

interface SavedRequestsPanelProps {
  items: SavedRequestRow[]
  onApplyRequest: (fields: HttpRequestFields) => void
  onDeleteSaved: (id: string) => Promise<void>
}

export function SavedRequestsPanel({
  items,
  onApplyRequest,
  onDeleteSaved,
}: SavedRequestsPanelProps) {
  const applySaved = (row: SavedRequestRow) => {
    const method: HttpMethod = isHttpMethod(row.method) ? row.method : 'GET'
    onApplyRequest({
      method,
      url: row.url,
      headers: row.headers,
      body: row.body,
    })
  }

  return (
    <CollapsibleSection title="Saved requests" className="saved-requests-panel">
      <p className="saved-requests-intro muted">
        Load a saved request into the editor or remove it from your account.
      </p>
      {items.length === 0 ? (
        <p className="muted saved-requests-empty">No saved requests yet.</p>
      ) : (
        <ul className="saved-requests-list">
          {items.map((row) => (
            <li key={row.id} className="saved-requests-item">
              <button
                type="button"
                className="saved-requests-item__main"
                onClick={() => applySaved(row)}
              >
                {row.name}
              </button>
              <button
                type="button"
                className="btn btn--ghost saved-requests-item__delete"
                aria-label={`Delete ${row.name}`}
                onClick={() => void onDeleteSaved(row.id)}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </CollapsibleSection>
  )
}
