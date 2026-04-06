import { sql } from 'drizzle-orm'
import { getDb } from './client.js'

/** Returns true if the database accepts a trivial query. */
export async function checkDatabase(): Promise<boolean> {
  if (!process.env.DATABASE_URL) {
    return false
  }
  try {
    await getDb().execute(sql`select 1`)
    return true
  } catch {
    return false
  }
}
