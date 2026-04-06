import { useMemo, useState } from 'react'
import {
  formatBodyForDisplay,
  type HttpExecutionError,
  type HttpExecutionResult,
} from '../lib/http'

interface ResponsePanelProps {
  result: HttpExecutionResult | null
}

function formatError(error: HttpExecutionError): string {
  switch (error.kind) {
    case 'invalid_url':
      return error.message
    case 'network':
      return error.message
    case 'aborted':
      return 'Request was cancelled.'
    case 'timeout':
      return 'Request timed out.'
    default: {
      const _exhaustive: never = error
      return _exhaustive
    }
  }
}

export function ResponsePanel({ result }: ResponsePanelProps) {
  const [prettyBody, setPrettyBody] = useState(true)

  const bodyDisplay = useMemo(() => {
    if (!result?.ok) return { text: '', isJson: false }
    const { formatted, isJson } = formatBodyForDisplay(result.response.body)
    return {
      text: prettyBody && isJson ? formatted : result.response.body,
      isJson,
    }
  }, [result, prettyBody])

  return (
    <section
      className="panel response-panel"
      aria-labelledby="response-heading"
    >
      <h2 id="response-heading" className="panel__title">
        Response
      </h2>

      {!result ? (
        <p className="muted">
          Send a request to see status, headers, and body here.
        </p>
      ) : null}

      {result && !result.ok ? (
        <div className="alert alert--error" role="alert">
          {formatError(result.error)}
        </div>
      ) : null}

      {result?.ok ? (
        <>
          <dl className="meta-grid">
            <div>
              <dt>Status</dt>
              <dd>
                <span className="status-code">{result.response.status}</span>{' '}
                {result.response.statusText}
              </dd>
            </div>
            <div>
              <dt>Time</dt>
              <dd>{result.response.durationMs} ms</dd>
            </div>
          </dl>

          <div className="field-block">
            <span className="field-label">Response headers</span>
            <div className="table-scroll">
              <table className="kv-table">
                <thead>
                  <tr>
                    <th scope="col">Name</th>
                    <th scope="col">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {result.response.headers.map((h, i) => (
                    <tr key={`${i}-${h.name}`}>
                      <td className="mono">{h.name}</td>
                      <td className="mono wrap">{h.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="field-block">
            <div className="field-block__head">
              <span className="field-label">Body</span>
              {bodyDisplay.isJson ? (
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={prettyBody}
                    onChange={(e) => setPrettyBody(e.target.checked)}
                  />{' '}
                  Pretty-print JSON
                </label>
              ) : null}
            </div>
            <pre className="body-pre mono" tabIndex={0}>
              {bodyDisplay.text || '—'}
            </pre>
          </div>
        </>
      ) : null}
    </section>
  )
}
