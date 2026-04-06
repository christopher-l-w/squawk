import { describe, expect, it } from 'vitest'
import { buildHeaders, buildRequestInit } from './buildRequestInit'
import type { HttpRequestFields } from './types'

describe('buildHeaders', () => {
  it('skips blank header names', () => {
    const h = buildHeaders([
      { name: '', value: 'x' },
      { name: '  ', value: 'y' },
      { name: 'Authorization', value: 'Bearer t' },
    ])
    expect([...h.entries()]).toEqual([['authorization', 'Bearer t']])
  })

  it('includes multiple distinct headers', () => {
    const h = buildHeaders([
      { name: 'Authorization', value: 'Bearer a' },
      { name: 'Accept', value: 'application/json' },
    ])
    expect(h.get('Authorization')).toBe('Bearer a')
    expect(h.get('Accept')).toBe('application/json')
  })
})

describe('buildRequestInit', () => {
  const base: HttpRequestFields = {
    method: 'GET',
    url: 'https://example.com',
    headers: [{ name: 'Accept', value: 'application/json' }],
    body: 'ignored for GET',
  }

  it('omits body for GET', () => {
    const init = buildRequestInit(base)
    expect(init.method).toBe('GET')
    expect(init.body).toBeUndefined()
  })

  it('sends body for POST when non-empty', () => {
    const init = buildRequestInit({
      ...base,
      method: 'POST',
      body: '{"a":1}',
    })
    expect(init.body).toBe('{"a":1}')
  })
})
