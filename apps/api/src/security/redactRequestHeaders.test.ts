import { describe, expect, it } from 'vitest'
import { filterPersistableHeaders } from './redactRequestHeaders.js'

describe('filterPersistableHeaders', () => {
  it('keeps only allowlisted names (case-insensitive)', () => {
    const out = filterPersistableHeaders([
      { name: 'Accept', value: 'application/json' },
      { name: 'Authorization', value: 'Bearer secret' },
      { name: 'content-type', value: 'text/plain' },
    ])
    expect(out).toEqual([
      { name: 'Accept', value: 'application/json' },
      { name: 'content-type', value: 'text/plain' },
    ])
  })

  it('drops Cookie and arbitrary X- auth headers', () => {
    const out = filterPersistableHeaders([
      { name: 'Cookie', value: 'a=b' },
      { name: 'X-API-Key', value: 'k' },
      { name: 'User-Agent', value: 'Squawk' },
    ])
    expect(out).toEqual([{ name: 'User-Agent', value: 'Squawk' }])
  })

  it('normalizes missing value to empty string for allowlisted headers', () => {
    const out = filterPersistableHeaders([{ name: 'Accept' }])
    expect(out).toEqual([{ name: 'Accept', value: '' }])
  })
})
