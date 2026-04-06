import { useCallback, useEffect, useState } from 'react'
import {
  appendHistoryEntry,
  createSavedRequest,
  deleteSavedRequest,
  listHistory,
  listSavedRequests,
  type HistoryRow,
  type SavedRequestRow,
} from './api/squawkData'
import { useAuth } from './auth/useAuth'
import { AuthHeader } from './components/AuthHeader'
import { LibraryPanel } from './components/LibraryPanel'
import { RequestPanel } from './components/RequestPanel'
import { SavedRequestsPanel } from './components/SavedRequestsPanel'
import { ResponsePanel } from './components/ResponsePanel'
import { useHttpRequest } from './hooks/useHttpRequest'
import { requestFieldsToCurl } from './lib/http'
import './App.css'

async function fetchLibraryLists(): Promise<{
  saved: SavedRequestRow[]
  history: HistoryRow[]
}> {
  const [saved, history] = await Promise.all([
    listSavedRequests(),
    listHistory(40),
  ])
  return { saved, history }
}

export default function App() {
  const { user } = useAuth()
  const [saved, setSaved] = useState<SavedRequestRow[]>([])
  const [history, setHistory] = useState<HistoryRow[]>([])

  useEffect(() => {
    if (!user) return
    let cancelled = false
    void (async () => {
      try {
        const { saved: s, history: h } = await fetchLibraryLists()
        if (!cancelled) {
          setSaved(s)
          setHistory(h)
        }
      } catch {
        if (!cancelled) {
          setSaved([])
          setHistory([])
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [user])

  const loadLibrary = useCallback(async () => {
    if (!user) return
    try {
      const { saved: s, history: h } = await fetchLibraryLists()
      setSaved(s)
      setHistory(h)
    } catch {
      setSaved([])
      setHistory([])
    }
  }, [user])

  const http = useHttpRequest({
    onSendComplete: ({ fields, result }) => {
      if (!user) return
      void appendHistoryEntry(fields, result).then(() => loadLibrary())
    },
  })

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

  const handleSave = async (name: string) => {
    await createSavedRequest(name, http.fields)
    await loadLibrary()
  }

  const handleDeleteSaved = async (id: string) => {
    await deleteSavedRequest(id)
    await loadLibrary()
  }

  return (
    <div className="app">
      <header className="app__header">
        <div className="app__brand">
          <h1 className="app__title">Squawk</h1>
          <p className="app__tagline">HTTP from the browser</p>
        </div>
        <div className="app__header-actions">
          <AuthHeader />
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
      {user ? (
        <>
          <LibraryPanel history={history} onApplyRequest={http.applyFields} />
          <SavedRequestsPanel
            items={saved}
            onApplyRequest={http.applyFields}
            onDeleteSaved={handleDeleteSaved}
          />
        </>
      ) : null}
      <main className="app__main">
        <RequestPanel
          http={http}
          onSend={handleSend}
          onSaveRequest={user ? handleSave : undefined}
        />
        <ResponsePanel result={http.result} />
      </main>
    </div>
  )
}
