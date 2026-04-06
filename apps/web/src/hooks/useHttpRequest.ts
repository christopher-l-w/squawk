import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  executeHttpRequest,
  type HttpExecutionResult,
  type HttpMethod,
  type HttpRequestFields,
} from '../lib/http'

const defaultHeaderRows = (): { name: string; value: string }[] => [
  { name: '', value: '' },
]

/**
 * In-memory request/response state for the main HTTP client screen.
 */
export function useHttpRequest() {
  const [method, setMethod] = useState<HttpMethod>('GET')
  const [url, setUrl] = useState('')
  const [headerRows, setHeaderRows] = useState(defaultHeaderRows)
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<HttpExecutionResult | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
    }
  }, [])

  const fields = useMemo<HttpRequestFields>(
    () => ({
      method,
      url,
      headers: headerRows.filter((h) => h.name.trim().length > 0),
      body,
    }),
    [method, url, headerRows, body],
  )

  const send = useCallback(async () => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setLoading(true)
    setResult(null)
    try {
      const out = await executeHttpRequest(fields, {
        signal: controller.signal,
      })
      setResult(out)
    } finally {
      setLoading(false)
    }
  }, [fields])

  const cancel = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  const addHeaderRow = useCallback(() => {
    setHeaderRows((rows) => [...rows, { name: '', value: '' }])
  }, [])

  const removeHeaderRow = useCallback((index: number) => {
    setHeaderRows((rows) => {
      const next = rows.filter((_, i) => i !== index)
      return next.length === 0 ? defaultHeaderRows() : next
    })
  }, [])

  const updateHeaderRow = useCallback(
    (index: number, patch: Partial<{ name: string; value: string }>) => {
      setHeaderRows((rows) =>
        rows.map((row, i) => (i === index ? { ...row, ...patch } : row)),
      )
    },
    [],
  )

  return {
    method,
    setMethod,
    url,
    setUrl,
    headerRows,
    body,
    setBody,
    loading,
    result,
    fields,
    send,
    cancel,
    addHeaderRow,
    removeHeaderRow,
    updateHeaderRow,
  }
}

export type HttpRequestController = ReturnType<typeof useHttpRequest>
