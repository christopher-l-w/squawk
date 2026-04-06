import { useState } from 'react'
import { AuthPanel } from './components/AuthPanel'
import { RequestPanel } from './components/RequestPanel'
import { ResponsePanel } from './components/ResponsePanel'
import { useHttpRequest } from './hooks/useHttpRequest'
import { requestFieldsToCurl } from './lib/http'
import './App.css'

export default function App() {
  const http = useHttpRequest()
  const [copyHint, setCopyHint] = useState<string | null>(null)

  const handleSend = () => {
    void http.send()
  }

  const copyCurl = async () => {
    const line = requestFieldsToCurl(http.fields)
    try {
      await navigator.clipboard.writeText(line)
      setCopyHint('Copied cURL to clipboard.')
      window.setTimeout(() => setCopyHint(null), 2500)
    } catch {
      setCopyHint('Could not copy (clipboard permission).')
      window.setTimeout(() => setCopyHint(null), 3500)
    }
  }

  return (
    <div className="app">
      <header className="app__header">
        <div className="app__brand">
          <h1 className="app__title">Squawk</h1>
          <p className="app__tagline">HTTP from the browser</p>
        </div>
        <div className="app__header-actions">
          <AuthPanel />
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => void copyCurl()}
          >
            Copy as cURL
          </button>
        </div>
      </header>
      {copyHint ? (
        <p className="copy-hint" role="status" aria-live="polite">
          {copyHint}
        </p>
      ) : null}
      <main className="app__main">
        <RequestPanel http={http} onSend={handleSend} />
        <ResponsePanel result={http.result} />
      </main>
    </div>
  )
}
