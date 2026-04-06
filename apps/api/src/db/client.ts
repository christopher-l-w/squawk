import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { drizzle } from 'drizzle-orm/node-postgres'
import pg from 'pg'
import * as schema from './schema.js'

let pool: pg.Pool | undefined
let db: NodePgDatabase<typeof schema> | undefined

function requireDatabaseUrl(): string {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error(
      'DATABASE_URL is not set. Copy .env.example to .env and start Postgres (e.g. docker compose up -d).',
    )
  }
  return url
}

export function getPool(): pg.Pool {
  if (!pool) {
    pool = new pg.Pool({ connectionString: requireDatabaseUrl() })
  }
  return pool
}

/** Lazily connects so importing the module does not throw when DATABASE_URL is unset (e.g. tests). */
export function getDb(): NodePgDatabase<typeof schema> {
  if (!db) {
    db = drizzle(getPool(), { schema })
  }
  return db
}

export async function closeDb(): Promise<void> {
  if (pool) {
    await pool.end()
    pool = undefined
    db = undefined
  }
}
