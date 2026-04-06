/**
 * Domain types for composing and inspecting HTTP calls. Kept free of React so
 * they can be reused by a future API layer or shared package.
 */

export const HTTP_METHODS = [
  'GET',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
  'HEAD',
  'OPTIONS',
] as const

export type HttpMethod = (typeof HTTP_METHODS)[number]

/** Editable request fields before execution */
export interface HttpRequestFields {
  method: HttpMethod
  /** Must be parseable by `new URL()` in the browser (absolute URL). */
  url: string
  /** Repeated header names are allowed (e.g. multiple Set-Cookie). */
  headers: readonly { name: string; value: string }[]
  /** Raw body string; ignored for GET/HEAD when empty. */
  body: string
}

/** Normalized response for display and tests */
export interface HttpResponseSnapshot {
  status: number
  statusText: string
  headers: { name: string; value: string }[]
  body: string
  /** Time from sending the request until the body was fully read */
  durationMs: number
}

export type HttpExecutionResult =
  | { ok: true; response: HttpResponseSnapshot }
  | { ok: false; error: HttpExecutionError }

export type HttpExecutionError =
  | { kind: 'invalid_url'; message: string }
  | { kind: 'network'; message: string }
  | { kind: 'aborted' }
  | { kind: 'timeout' }
