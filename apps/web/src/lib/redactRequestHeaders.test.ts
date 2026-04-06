import { describe, expect, it } from 'vitest'
import {
  filterPersistableHeaders,
  getHeadersNotPersisted,
  PERSISTABLE_HEADER_LABELS,
} from './redactRequestHeaders'

describe('filterPersistableHeaders', () => {
  it('matches API allowlist', () => {
    expect(
      filterPersistableHeaders([
        { name: 'Authorization', value: 'x' },
        { name: 'Accept', value: '*/*' },
      ]),
    ).toEqual([{ name: 'Accept', value: '*/*' }])
  })
})

describe('getHeadersNotPersisted', () => {
  it('lists non-allowlisted rows with non-empty names only', () => {
    expect(
      getHeadersNotPersisted([
        { name: '', value: 'x' },
        { name: 'Authorization', value: 'bearer' },
        { name: 'Accept', value: 'json' },
      ]),
    ).toEqual([{ name: 'Authorization', value: 'bearer' }])
  })
})

describe('PERSISTABLE_HEADER_LABELS', () => {
  it('exposes sorted HTTP-style labels for UI', () => {
    expect(PERSISTABLE_HEADER_LABELS).toContain('Accept')
    expect(PERSISTABLE_HEADER_LABELS).toContain('Content-Type')
    expect(PERSISTABLE_HEADER_LABELS).toContain('X-Request-Id')
    expect(PERSISTABLE_HEADER_LABELS.length).toBe(9)
  })
})
