import { describe, expect, it } from 'vitest'
import { formatBodyForDisplay } from './formatBody'

describe('formatBodyForDisplay', () => {
  it('pretty-prints JSON object', () => {
    const { formatted, isJson } = formatBodyForDisplay('{"a":1}')
    expect(isJson).toBe(true)
    expect(formatted).toContain('\n')
  })

  it('leaves non-JSON as-is', () => {
    const { formatted, isJson } = formatBodyForDisplay('plain text')
    expect(isJson).toBe(false)
    expect(formatted).toBe('plain text')
  })
})
