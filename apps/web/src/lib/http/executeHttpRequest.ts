import { buildRequestInit } from './buildRequestInit'
import type {
  HttpExecutionError,
  HttpExecutionResult,
  HttpRequestFields,
  HttpResponseSnapshot,
} from './types'

const DEFAULT_TIMEOUT_MS = 120_000

export interface ExecuteHttpRequestOptions {
  /** Combined with internal timeout; either abort fails the request */
  signal?: AbortSignal
  timeoutMs?: number
  /** Injected for tests */
  fetchFn?: typeof fetch
}

/**
 * Performs one HTTP round-trip using `fetch`, with timeout and typed outcomes.
 * Network failures (including many CORS blocks) surface as `network` errors.
 */
export async function executeHttpRequest(
  fields: HttpRequestFields,
  options: ExecuteHttpRequestOptions = {},
): Promise<HttpExecutionResult> {
  const fetchFn = options.fetchFn ?? globalThis.fetch
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS

  let parsed: URL
  try {
    parsed = new URL(fields.url.trim())
  } catch {
    return {
      ok: false,
      error: {
        kind: 'invalid_url',
        message:
          'Enter a valid absolute URL (for example https://api.example.com/path).',
      },
    }
  }

  const controller = new AbortController()
  const { signal } = controller

  if (options.signal) {
    if (options.signal.aborted) {
      return { ok: false, error: { kind: 'aborted' } }
    }
    options.signal.addEventListener('abort', () => controller.abort(), {
      once: true,
    })
  }

  let timedOut = false
  const timeoutId = setTimeout(() => {
    timedOut = true
    controller.abort()
  }, timeoutMs)

  const init = buildRequestInit(fields)
  const started = performance.now()

  try {
    const res = await fetchFn(parsed.toString(), { ...init, signal })
    clearTimeout(timeoutId)
    const body = await res.text()
    const durationMs = Math.round(performance.now() - started)

    const headerList: { name: string; value: string }[] = []
    res.headers.forEach((value, name) => {
      headerList.push({ name, value })
    })

    const snapshot: HttpResponseSnapshot = {
      status: res.status,
      statusText: res.statusText,
      headers: headerList,
      body,
      durationMs,
    }
    return { ok: true, response: snapshot }
  } catch (err) {
    clearTimeout(timeoutId)
    if (timedOut) {
      return { ok: false, error: { kind: 'timeout' } }
    }
    if (signal.aborted) {
      return { ok: false, error: { kind: 'aborted' } }
    }
    const message = toNetworkMessage(err)
    const error: HttpExecutionError = { kind: 'network', message }
    return { ok: false, error }
  }
}

function toNetworkMessage(err: unknown): string {
  if (err instanceof TypeError && err.message) {
    return `${err.message} If the URL is correct, the server may be blocking browser requests (CORS); a backend proxy can fix that later.`
  }
  if (err instanceof Error && err.message) {
    return err.message
  }
  return 'Request failed. Check the URL, TLS, and CORS policy on the target API.'
}
