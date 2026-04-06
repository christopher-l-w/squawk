import { getApiBaseUrl } from '../auth/config'
import type { HttpExecutionResult, HttpRequestFields } from '../lib/http'

async function apiFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const base = getApiBaseUrl()
  if (!base) throw new Error('VITE_API_URL is not configured')

  const headers = new Headers(init.headers)
  if (init.body != null && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  return fetch(`${base}${path}`, {
    ...init,
    credentials: 'include',
    headers,
  })
}

export type SavedRequestRow = {
  id: string
  userId: string
  name: string
  method: string
  url: string
  headers: { name: string; value: string }[]
  body: string
  createdAt: string
  updatedAt: string
}

export type HistoryRow = {
  id: string
  userId: string
  method: string
  url: string
  requestHeaders: { name: string; value: string }[]
  requestBody: string
  statusCode: number | null
  durationMs: number | null
  errorMessage: string | null
  createdAt: string
}

export async function listSavedRequests(): Promise<SavedRequestRow[]> {
  const res = await apiFetch('/saved-requests', { method: 'GET' })
  if (res.status === 401) throw new Error('Sign in to view saved requests')
  if (!res.ok) throw new Error('Failed to load saved requests')
  const data = (await res.json()) as { items: SavedRequestRow[] }
  return data.items
}

export async function createSavedRequest(
  name: string,
  fields: HttpRequestFields,
): Promise<SavedRequestRow> {
  const res = await apiFetch('/saved-requests', {
    method: 'POST',
    body: JSON.stringify({
      name,
      method: fields.method,
      url: fields.url,
      headers: fields.headers,
      body: fields.body,
    }),
  })
  if (res.status === 401) throw new Error('Sign in to save requests')
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(err.error ?? 'Save failed')
  }
  const data = (await res.json()) as { item: SavedRequestRow }
  return data.item
}

export async function deleteSavedRequest(id: string): Promise<void> {
  const res = await apiFetch(`/saved-requests/${id}`, { method: 'DELETE' })
  if (res.status === 401) throw new Error('Sign in required')
  if (!res.ok) throw new Error('Delete failed')
}

export async function listHistory(limit = 50): Promise<HistoryRow[]> {
  const res = await apiFetch(`/history?limit=${limit}`, { method: 'GET' })
  if (res.status === 401) throw new Error('Sign in to view history')
  if (!res.ok) throw new Error('Failed to load history')
  const data = (await res.json()) as { items: HistoryRow[] }
  return data.items
}

export function buildHistoryPayload(
  fields: HttpRequestFields,
  result: HttpExecutionResult,
): {
  method: string
  url: string
  headers: { name: string; value: string }[]
  body: string
  statusCode: number | null
  durationMs: number | null
  errorMessage: string | null
} {
  const base = {
    method: fields.method,
    url: fields.url,
    headers: fields.headers.map((h) => ({ ...h })),
    body: fields.body,
  }
  if (result.ok) {
    return {
      ...base,
      statusCode: result.response.status,
      durationMs: result.response.durationMs,
      errorMessage: null,
    }
  }
  const err = result.error
  let errorMessage: string
  switch (err.kind) {
    case 'invalid_url':
      errorMessage = err.message
      break
    case 'network':
      errorMessage = err.message
      break
    case 'aborted':
      errorMessage = 'Cancelled'
      break
    case 'timeout':
      errorMessage = 'Request timed out'
      break
  }
  return {
    ...base,
    statusCode: null,
    durationMs: null,
    errorMessage,
  }
}

export async function appendHistoryEntry(
  fields: HttpRequestFields,
  result: HttpExecutionResult,
): Promise<void> {
  const base = getApiBaseUrl()
  if (!base) return

  const payload = buildHistoryPayload(fields, result)
  const res = await apiFetch('/history', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  if (!res.ok && res.status !== 401) {
    console.warn('History append failed', await res.text())
  }
}
