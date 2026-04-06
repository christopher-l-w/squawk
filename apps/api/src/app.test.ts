import { describe, expect, it } from 'vitest'
import { createApp } from './app.js'

describe('createApp', () => {
  it('GET /health returns ok', async () => {
    const app = createApp()
    const res = await app.request('http://localhost/health')
    expect(res.status).toBe(200)
    const body = (await res.json()) as { status: string }
    expect(body.status).toBe('ok')
  })

  it('GET /v1/auth/me returns 401 without session', async () => {
    const app = createApp()
    const res = await app.request('http://localhost/v1/auth/me')
    expect(res.status).toBe(401)
  })
})
