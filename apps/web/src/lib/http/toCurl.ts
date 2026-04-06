import type { HttpRequestFields } from './types'
import { buildRequestInit } from './buildRequestInit'

/**
 * Builds a rough curl equivalent for sharing or debugging (not a byte-perfect
 * reproduction of every fetch edge case).
 */
export function requestFieldsToCurl(fields: HttpRequestFields): string {
  const init = buildRequestInit(fields)
  const url = fields.url.trim()
  const parts = ['curl', '-X', fields.method, shellQuote(url)]

  const headers = init.headers
  if (headers instanceof Headers) {
    headers.forEach((value, name) => {
      parts.push('-H', shellQuote(`${name}: ${value}`))
    })
  }

  if (init.body != null && typeof init.body === 'string' && init.body.length) {
    parts.push('--data', shellQuote(init.body))
  }

  return parts.join(' ')
}

function shellQuote(s: string): string {
  if (!/[^\w@%+=:,./-]/.test(s)) {
    return s
  }
  return `'${s.replace(/'/g, `'\\''`)}'`
}
