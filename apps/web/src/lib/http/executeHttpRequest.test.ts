import { describe, expect, it, vi } from 'vitest'
import { executeHttpRequest } from './executeHttpRequest'
import type { HttpRequestFields } from './types'

const sampleFields = (url: string): HttpRequestFields => ({
  method: 'GET',
  url,
  headers: [{ name: 'Accept', value: 'text/plain' }],
  body: '',
})

describe('executeHttpRequest', () => {
  it('returns invalid_url for bad URL', async () => {
    const result = await executeHttpRequest(sampleFields('not-a-url'), {
      fetchFn: vi.fn(),
    })
    expect(result.ok).toBe(false)
    if (result.ok) throw new Error('expected error')
    expect(result.error.kind).toBe('invalid_url')
  })

  it('returns response snapshot on success', async () => {
    const fetchFn = vi.fn(async () => {
      return new Response('hello', {
        status: 200,
        statusText: 'OK',
        headers: { 'content-type': 'text/plain' },
      })
    })
    const result = await executeHttpRequest(
      sampleFields('https://example.com/api'),
      { fetchFn },
    )
    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error('expected ok')
    expect(result.response.status).toBe(200)
    expect(result.response.body).toBe('hello')
    expect(result.response.headers.some((h) => h.name === 'content-type')).toBe(
      true,
    )
    expect(fetchFn).toHaveBeenCalledOnce()
  })

  it('maps network failures', async () => {
    const fetchFn = vi.fn(async () => {
      throw new TypeError('Failed to fetch')
    })
    const result = await executeHttpRequest(
      sampleFields('https://example.com/api'),
      { fetchFn },
    )
    expect(result.ok).toBe(false)
    if (result.ok) throw new Error('expected error')
    expect(result.error.kind).toBe('network')
  })

  it('honors timeout', async () => {
    const fetchFn = vi.fn((_url: string, init?: RequestInit) => {
      return new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener(
          'abort',
          () => {
            reject(new DOMException('Aborted', 'AbortError'))
          },
          { once: true },
        )
      })
    })
    const result = await executeHttpRequest(
      sampleFields('https://example.com/slow'),
      {
        fetchFn,
        timeoutMs: 50,
      },
    )
    expect(result.ok).toBe(false)
    if (result.ok) throw new Error('expected error')
    expect(result.error.kind).toBe('timeout')
  })
})
