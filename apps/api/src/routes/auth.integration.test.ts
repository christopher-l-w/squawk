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

  it('PATCH /auth/me updates display name; DELETE /auth/me removes user', async () => {
    const email = `profile-${Date.now()}@example.com`
    const password = 'password12345'

    const reg = await app.request('http://localhost/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    expect(reg.status).toBe(201)
    const cookieHeader = cookiePairFromSetCookie(reg.headers.get('set-cookie'))

    const patch = await app.request('http://localhost/auth/me', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieHeader,
      },
      body: JSON.stringify({ displayName: '  Pat Example  ' }),
    })
    expect(patch.status).toBe(200)
    const patchBody = (await patch.json()) as {
      user: { displayName: string | null }
    }
    expect(patchBody.user.displayName).toBe('Pat Example')

    const del = await app.request('http://localhost/auth/me', {
      method: 'DELETE',
      headers: { Cookie: cookieHeader },
    })
    expect(del.status).toBe(200)

    const gone = await app.request('http://localhost/auth/me', {
      headers: { Cookie: cookieHeader },
    })
    expect(gone.status).toBe(401)
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

  it('saved requests and history require auth; CRUD works with session', async () => {
    const email = `library-${Date.now()}@example.com`
    const password = 'password12345'

    const unauth = await app.request('http://localhost/saved-requests')
    expect(unauth.status).toBe(401)

    const reg = await app.request('http://localhost/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    expect(reg.status).toBe(201)
    const cookieHeader = cookiePairFromSetCookie(reg.headers.get('set-cookie'))

    const created = await app.request('http://localhost/saved-requests', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieHeader,
      },
      body: JSON.stringify({
        name: 'Example',
        method: 'GET',
        url: 'https://example.com/path',
        headers: [{ name: 'Accept', value: 'application/json' }],
        body: '',
      }),
    })
    expect(created.status).toBe(201)
    const createdJson = (await created.json()) as {
      item: { id: string; name: string; url: string }
    }
    expect(createdJson.item.name).toBe('Example')

    const listSaved = await app.request('http://localhost/saved-requests', {
      headers: { Cookie: cookieHeader },
    })
    expect(listSaved.status).toBe(200)
    const listSavedJson = (await listSaved.json()) as {
      items: { id: string }[]
    }
    expect(listSavedJson.items.some((r) => r.id === createdJson.item.id)).toBe(
      true,
    )

    const histPost = await app.request('http://localhost/history', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieHeader,
      },
      body: JSON.stringify({
        method: 'POST',
        url: 'https://api.example.com/x',
        headers: [],
        body: '{}',
        statusCode: 201,
        durationMs: 42,
        errorMessage: null,
      }),
    })
    expect(histPost.status).toBe(201)

    const listHist = await app.request('http://localhost/history?limit=10', {
      headers: { Cookie: cookieHeader },
    })
    expect(listHist.status).toBe(200)
    const listHistJson = (await listHist.json()) as { items: { url: string }[] }
    expect(listHistJson.items[0]?.url).toBe('https://api.example.com/x')

    const del = await app.request(
      `http://localhost/saved-requests/${createdJson.item.id}`,
      { method: 'DELETE', headers: { Cookie: cookieHeader } },
    )
    expect(del.status).toBe(200)
  })
})
