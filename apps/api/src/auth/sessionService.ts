import { and, eq, gt } from 'drizzle-orm'
import type { Context } from 'hono'
import { getCookie } from 'hono/cookie'
import { getDb } from '../db/client.js'
import { sessions, users } from '../db/schema.js'
import { SESSION_COOKIE_NAME } from './constants.js'
import { hashSessionToken } from './token.js'

export type AuthUser = { id: string; email: string }

/**
 * Resolves the current user from the session cookie, or null if missing/invalid/expired.
 */
export async function getSessionUser(c: Context): Promise<AuthUser | null> {
  const raw = getCookie(c, SESSION_COOKIE_NAME)
  if (!raw) return null

  const tokenHash = hashSessionToken(raw)
  const db = getDb()

  const rows = await db
    .select({
      id: users.id,
      email: users.email,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(
      and(
        eq(sessions.tokenHash, tokenHash),
        gt(sessions.expiresAt, new Date()),
      ),
    )
    .limit(1)

  const row = rows[0]
  if (!row) return null

  return { id: row.id, email: row.email }
}
