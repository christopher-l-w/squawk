import { eq } from 'drizzle-orm'
import type { Context } from 'hono'
import { Hono } from 'hono'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import { z } from 'zod'
import { SESSION_COOKIE_NAME, SESSION_MAX_AGE_SEC } from '../auth/constants.js'
import {
  createSessionForUser,
  deleteSessionByRawToken,
} from '../auth/createSession.js'
import { hashPassword, verifyPassword } from '../auth/password.js'
import { getSessionUser } from '../auth/sessionService.js'
import { getDb } from '../db/client.js'
import { users } from '../db/schema.js'

const credentialsSchema = z.object({
  email: z.string().min(1).max(255).email(),
  password: z.string().min(8).max(256),
})

type Credentials = z.infer<typeof credentialsSchema>

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function setSessionCookie(c: Context, token: string) {
  setCookie(c, SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    path: '/',
    sameSite: 'Lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: SESSION_MAX_AGE_SEC,
  })
}

async function parseCredentials(
  c: Context,
): Promise<
  { ok: true; data: Credentials } | { ok: false; response: Response }
> {
  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return { ok: false, response: c.json({ error: 'Invalid JSON' }, 400) }
  }
  const parsed = credentialsSchema.safeParse(body)
  if (!parsed.success) {
    return {
      ok: false,
      response: c.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        400,
      ),
    }
  }
  return { ok: true, data: parsed.data }
}

export function createAuthRoutes() {
  const r = new Hono()

  r.post('/register', async (c) => {
    const parsed = await parseCredentials(c)
    if (!parsed.ok) return parsed.response
    const { email, password } = parsed.data
    const normalizedEmail = normalizeEmail(email)
    const passwordHash = await hashPassword(password)
    const db = getDb()

    try {
      const inserted = await db
        .insert(users)
        .values({
          email: normalizedEmail,
          passwordHash,
        })
        .returning({ id: users.id, email: users.email })

      const row = inserted[0]
      if (!row) {
        return c.json({ error: 'Registration failed' }, 500)
      }

      const token = await createSessionForUser(row.id)
      setSessionCookie(c, token)

      return c.json({ user: { id: row.id, email: row.email } }, 201)
    } catch (err: unknown) {
      if (
        err &&
        typeof err === 'object' &&
        'code' in err &&
        err.code === '23505'
      ) {
        return c.json({ error: 'Email already registered' }, 409)
      }
      throw err
    }
  })

  r.post('/login', async (c) => {
    const parsed = await parseCredentials(c)
    if (!parsed.ok) return parsed.response
    const { email, password } = parsed.data
    const normalizedEmail = normalizeEmail(email)
    const db = getDb()

    const found = await db
      .select()
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1)

    const user = found[0]
    if (!user?.passwordHash) {
      return c.json({ error: 'Invalid email or password' }, 401)
    }

    const ok = await verifyPassword(password, user.passwordHash)
    if (!ok) {
      return c.json({ error: 'Invalid email or password' }, 401)
    }

    const token = await createSessionForUser(user.id)
    setSessionCookie(c, token)

    return c.json({ user: { id: user.id, email: user.email } })
  })

  r.post('/logout', async (c) => {
    const raw = getCookie(c, SESSION_COOKIE_NAME)
    if (raw) {
      await deleteSessionByRawToken(raw)
    }
    deleteCookie(c, SESSION_COOKIE_NAME, { path: '/' })
    return c.json({ ok: true })
  })

  r.get('/me', async (c) => {
    const user = await getSessionUser(c)
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    return c.json({ user })
  })

  return r
}
