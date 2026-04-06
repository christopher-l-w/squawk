import type { HttpRequestController } from '../hooks/useHttpRequest'
import { HTTP_METHODS, type HttpMethod } from '../lib/http'

interface RequestPanelProps {
  http: HttpRequestController
  onSend: () => void
}

export function RequestPanel({ http, onSend }: RequestPanelProps) {
  const {
    method,
    setMethod,
    url,
    setUrl,
    headerRows,
    body,
    setBody,
    loading,
    addHeaderRow,
    removeHeaderRow,
    updateHeaderRow,
    cancel,
  } = http

  return (
    <section className="panel request-panel" aria-labelledby="request-heading">
      <h2 id="request-heading" className="panel__title">
        Request
      </h2>

      <div className="field-row">
        <label htmlFor="http-method" className="sr-only">
          HTTP method
        </label>
        <select
          id="http-method"
          className="input method-select"
          value={method}
          onChange={(e) => setMethod(e.target.value as HttpMethod)}
        >
          {HTTP_METHODS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <label htmlFor="request-url" className="sr-only">
          Request URL
        </label>
        <input
          id="request-url"
          type="url"
          className="input url-input"
          placeholder="https://api.example.com/v1/resource"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          autoComplete="url"
          spellCheck={false}
        />
      </div>

      <div className="field-block">
        <div className="field-block__head">
          <span className="field-label">Headers</span>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={addHeaderRow}
          >
            Add header
          </button>
        </div>
        <ul className="header-list" aria-label="Request headers">
          {headerRows.map((row, index) => (
            <li key={index} className="header-row">
              <label className="sr-only" htmlFor={`header-name-${index}`}>
                Header name
              </label>
              <input
                id={`header-name-${index}`}
                className="input header-name"
                placeholder="Name"
                value={row.name}
                onChange={(e) =>
                  updateHeaderRow(index, { name: e.target.value })
                }
                spellCheck={false}
              />
              <label className="sr-only" htmlFor={`header-value-${index}`}>
                Header value
              </label>
              <input
                id={`header-value-${index}`}
                className="input header-value"
                placeholder="Value"
                value={row.value}
                onChange={(e) =>
                  updateHeaderRow(index, { value: e.target.value })
                }
                spellCheck={false}
              />
              <button
                type="button"
                className="btn btn--ghost header-remove"
                onClick={() => removeHeaderRow(index)}
                aria-label={`Remove header row ${index + 1}`}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="field-block">
        <label htmlFor="request-body" className="field-label">
          Body
        </label>
        <textarea
          id="request-body"
          className="input body-input"
          rows={10}
          placeholder="JSON, plain text, or leave empty"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          spellCheck={false}
        />
      </div>

      <div className="actions">
        <button
          type="button"
          className="btn btn--primary"
          onClick={onSend}
          disabled={loading}
        >
          {loading ? 'Sending…' : 'Send'}
        </button>
        {loading ? (
          <button type="button" className="btn" onClick={cancel}>
            Cancel
          </button>
        ) : null}
      </div>
    </section>
  )
}
