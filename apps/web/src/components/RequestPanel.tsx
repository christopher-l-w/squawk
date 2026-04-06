import { useCallback, useState } from 'react'
import type { HttpRequestController } from '../hooks/useHttpRequest'
import { HTTP_METHODS, type HttpMethod } from '../lib/http'
import { getHeadersNotPersisted } from '../lib/redactRequestHeaders'
import { SaveHeadersModal } from './SaveHeadersModal'

interface RequestPanelProps {
  http: HttpRequestController
  onSend: () => void
  /** When set, show name + Save under the Request title (signed-in users). */
  onSaveRequest?: (name: string) => Promise<void>
}

export function RequestPanel({
  http,
  onSend,
  onSaveRequest,
}: RequestPanelProps) {
  const {
    method,
    setMethod,
    url,
    setUrl,
    headerRows,
    body,
    setBody,
    loading,
    fields,
    addHeaderRow,
    removeHeaderRow,
    updateHeaderRow,
    cancel,
  } = http

  const [saveName, setSaveName] = useState('')
  const [saveBusy, setSaveBusy] = useState(false)
  const [saveModalNames, setSaveModalNames] = useState<string[] | null>(null)

  const performSave = useCallback(
    async (name: string) => {
      if (!onSaveRequest) return
      setSaveBusy(true)
      try {
        await onSaveRequest(name)
        setSaveName('')
      } finally {
        setSaveBusy(false)
      }
    },
    [onSaveRequest],
  )

  const handleSave = () => {
    if (!onSaveRequest) return
    const name = saveName.trim()
    if (!name) return

    const notPersisted = getHeadersNotPersisted(fields.headers)
    if (notPersisted.length > 0) {
      const uniqueNames = [...new Set(notPersisted.map((h) => h.name.trim()))]
      setSaveModalNames(uniqueNames)
      return
    }

    void performSave(name)
  }

  const handleSaveModalContinue = () => {
    const name = saveName.trim()
    setSaveModalNames(null)
    if (!name) return
    void performSave(name)
  }

  const handleSaveModalCancel = () => {
    setSaveModalNames(null)
  }

  return (
    <>
      {saveModalNames !== null ? (
        <SaveHeadersModal
          headerNames={saveModalNames}
          onCancel={handleSaveModalCancel}
          onContinue={handleSaveModalContinue}
        />
      ) : null}
      <section
        className="panel request-panel"
        aria-labelledby="request-heading"
      >
        <h2 id="request-heading" className="panel__title">
          Request
        </h2>

        {onSaveRequest ? (
          <div className="request-save-row">
            <label htmlFor="save-request-name" className="sr-only">
              Name this request
            </label>
            <input
              id="save-request-name"
              className="input request-save-name"
              placeholder="Name this request"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              maxLength={255}
            />
            <button
              type="button"
              className="btn btn--primary"
              disabled={saveBusy || !saveName.trim()}
              onClick={handleSave}
            >
              Save
            </button>
          </div>
        ) : null}

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
    </>
  )
}
