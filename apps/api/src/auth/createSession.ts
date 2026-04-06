import { eq } from 'drizzle-orm'
import { getDb } from '../db/client.js'
import { sessions } from '../db/schema.js'
import { SESSION_MAX_MS } from './constants.js'
import { generateSessionToken, hashSessionToken } from './token.js'

export async function createSessionForUser(userId: string): Promise<string> {
  const token = generateSessionToken()
  const tokenHash = hashSessionToken(token)
  const expiresAt = new Date(Date.now() + SESSION_MAX_MS)
  await getDb().insert(sessions).values({
    userId,
    tokenHash,
    expiresAt,
  })
  return token
}

export async function deleteSessionByRawToken(rawToken: string): Promise<void> {
  const tokenHash = hashSessionToken(rawToken)
  await getDb().delete(sessions).where(eq(sessions.tokenHash, tokenHash))
}
