import { createHash, randomBytes } from 'node:crypto'

/** Raw token sent to the client (cookie only); never stored verbatim. */
export function generateSessionToken(): string {
  return randomBytes(32).toString('base64url')
}

/** SHA-256 hex digest stored in `sessions.token_hash`. */
export function hashSessionToken(rawToken: string): string {
  return createHash('sha256').update(rawToken, 'utf8').digest('hex')
}
