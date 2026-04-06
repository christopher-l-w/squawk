import { describe, expect, it } from 'vitest'
import { createApp } from '../app.js'

const describeAuth = process.env.DATABASE_URL ? describe : describe.skip

function cookiePairFromSetCookie(setCookie: string | null): string {
  if (!setCookie) return ''
  const first = setCookie.split(',')[0]?.trim() ?? ''
  return first.split(';')[0]?.trim() ?? ''
}

describeAuth('auth HTTP routes', () => {
  const app = createApp()

  it('register, /me, logout flow', async () => {
    const email = `user-${Date.now()}@example.com`
    const password = 'password12345'

    const reg = await app.request('http://localhost/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    expect(reg.status).toBe(201)
    const setCookie = reg.headers.get('set-cookie')
    expect(setCookie).toContain('squawk_session')
    const cookieHeader = cookiePairFromSetCookie(setCookie)

    const me = await app.request('http://localhost/auth/me', {
      headers: { Cookie: cookieHeader },
    })
    expect(me.status).toBe(200)
    const meBody = (await me.json()) as { user: { email: string } }
    expect(meBody.user.email).toBe(email.trim().toLowerCase())

    const out = await app.request('http://localhost/auth/logout', {
      method: 'POST',
      headers: { Cookie: cookieHeader },
    })
    expect(out.status).toBe(200)

    const after = await app.request('http://localhost/auth/me', {
      headers: { Cookie: cookieHeader },
    })
    expect(after.status).toBe(401)
  })

  it('login with existing user', async () => {
    const email = `login-${Date.now()}@example.com`
    const password = 'password12345'

    await app.request('http://localhost/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    const login = await app.request('http://localhost/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    expect(login.status).toBe(200)
    const setCookie = login.headers.get('set-cookie')
    const cookieHeader = cookiePairFromSetCookie(setCookie)

    const me = await app.request('http://localhost/auth/me', {
      headers: { Cookie: cookieHeader },
    })
    expect(me.status).toBe(200)
  })
})
