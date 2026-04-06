import { describe, expect, it } from 'vitest'
import { generateSessionToken, hashSessionToken } from './token.js'

describe('session token helpers', () => {
  it('hashes deterministically', () => {
    expect(hashSessionToken('same')).toBe(hashSessionToken('same'))
    expect(hashSessionToken('a')).not.toBe(hashSessionToken('b'))
  })

  it('generateSessionToken yields distinct values', () => {
    const a = generateSessionToken()
    const b = generateSessionToken()
    expect(a.length).toBeGreaterThan(20)
    expect(a).not.toBe(b)
  })
})
