import type { HttpRequestFields } from './types'

/**
 * Builds `Headers` from editable rows. Skips blank names so users can keep
 * spare rows without affecting the wire request.
 */
export function buildHeaders(headers: HttpRequestFields['headers']): Headers {
  const h = new Headers()
  for (const { name, value } of headers) {
    const trimmed = name.trim()
    if (!trimmed) continue
    h.append(trimmed, value)
  }
  return h
}

/**
 * Maps UI fields to `RequestInit`. GET/HEAD omit a body even if the textarea
 * has text, matching typical browser and curl semantics for simple clients.
 */
export function buildRequestInit(fields: HttpRequestFields): RequestInit {
  const { method, body } = fields
  const headers = buildHeaders(fields.headers)
  const omitBody = method === 'GET' || method === 'HEAD'
  return {
    method,
    headers,
    body: omitBody ? undefined : body.length > 0 ? body : undefined,
  }
}
