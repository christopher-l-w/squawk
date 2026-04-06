import { and, eq } from 'drizzle-orm'
import { getDb } from '../db/client.js'
import { oauthAccounts, users } from '../db/schema.js'

export type OAuthProvider = 'google'

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function placeholderEmail(provider: OAuthProvider, subject: string): string {
  const safe = subject.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64)
  return `${provider}-${safe || 'user'}@oauth.squawk.local`
}

function normalizeDisplayName(name: string | null | undefined): string | null {
  if (name == null) return null
  const t = name.trim()
  return t.length > 0 ? t.slice(0, 255) : null
}

async function applyDisplayName(
  userId: string,
  displayName: string | null,
): Promise<void> {
  if (displayName == null) return
  await getDb().update(users).set({ displayName }).where(eq(users.id, userId))
}

async function loadUserRow(
  userId: string,
): Promise<{ id: string; email: string; displayName: string | null }> {
  const u = await getDb()
    .select({
      id: users.id,
      email: users.email,
      displayName: users.displayName,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
  const row = u[0]
  if (!row) throw new Error('User missing after oauth')
  return {
    id: row.id,
    email: row.email,
    displayName: row.displayName ?? null,
  }
}

/**
 * Finds an existing user by OAuth link, or links/creates a user and attaches the account.
 * When `nameFromProvider` is set (e.g. Google full name), stores it on the user row.
 */
export async function findOrCreateUserFromOAuth(
  provider: OAuthProvider,
  providerSubject: string,
  emailFromProvider: string | null,
  nameFromProvider: string | null = null,
): Promise<{ id: string; email: string; displayName: string | null }> {
  const db = getDb()
  const displayName = normalizeDisplayName(nameFromProvider)

  const linked = await db
    .select({ userId: oauthAccounts.userId })
    .from(oauthAccounts)
    .where(
      and(
        eq(oauthAccounts.provider, provider),
        eq(oauthAccounts.providerSubject, providerSubject),
      ),
    )
    .limit(1)

  if (linked[0]) {
    const userId = linked[0].userId
    await applyDisplayName(userId, displayName)
    return loadUserRow(userId)
  }

  const email =
    emailFromProvider && emailFromProvider.trim().length > 0
      ? normalizeEmail(emailFromProvider)
      : placeholderEmail(provider, providerSubject)

  const existingUser = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(eq(users.email, email))
    .limit(1)

  let userId: string

  if (existingUser[0]) {
    userId = existingUser[0].id
    await applyDisplayName(userId, displayName)
  } else {
    const inserted = await db
      .insert(users)
      .values({
        email,
        passwordHash: null,
        displayName: displayName ?? undefined,
      })
      .returning({ id: users.id })
    const row = inserted[0]
    if (!row) throw new Error('Failed to create user')
    userId = row.id
  }

  try {
    await db.insert(oauthAccounts).values({
      userId,
      provider,
      providerSubject,
    })
  } catch (err: unknown) {
    if (
      err &&
      typeof err === 'object' &&
      'code' in err &&
      err.code === '23505'
    ) {
      const again = await db
        .select({
          id: users.id,
          email: users.email,
          displayName: users.displayName,
        })
        .from(oauthAccounts)
        .innerJoin(users, eq(users.id, oauthAccounts.userId))
        .where(
          and(
            eq(oauthAccounts.provider, provider),
            eq(oauthAccounts.providerSubject, providerSubject),
          ),
        )
        .limit(1)
      const row = again[0]
      if (row) {
        await applyDisplayName(row.id, displayName)
        return {
          id: row.id,
          email: row.email,
          displayName: row.displayName ?? null,
        }
      }
    }
    throw err
  }

  return loadUserRow(userId)
}
