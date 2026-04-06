import { describe, expect, it } from 'vitest'
import { requestFieldsToCurl } from './toCurl'
import type { HttpRequestFields } from './types'

describe('requestFieldsToCurl', () => {
  it('includes method and URL', () => {
    const fields: HttpRequestFields = {
      method: 'GET',
      url: 'https://example.com',
      headers: [],
      body: '',
    }
    expect(requestFieldsToCurl(fields)).toContain('curl -X GET')
    expect(requestFieldsToCurl(fields)).toContain('https://example.com')
  })

  it('adds --data for POST body', () => {
    const fields: HttpRequestFields = {
      method: 'POST',
      url: 'https://example.com',
      headers: [],
      body: '{"x":1}',
    }
    const line = requestFieldsToCurl(fields)
    expect(line).toContain('--data')
    expect(line).toContain('{"x":1}')
  })
})
