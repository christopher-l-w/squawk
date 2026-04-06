import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { config } from 'dotenv'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { drizzle } from 'drizzle-orm/node-postgres'
import pg from 'pg'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const apiRoot = path.join(__dirname, '..', '..')
config({ path: path.join(apiRoot, '.env') })
config({ path: path.join(apiRoot, '..', '..', '.env') })

function requireDatabaseUrl(): string {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error(
      'DATABASE_URL is not set. Copy .env.example to .env and start Postgres.',
    )
  }
  return url
}

const pool = new pg.Pool({ connectionString: requireDatabaseUrl() })
const db = drizzle(pool)

const migrationsFolder = path.join(__dirname, '../../drizzle')

await migrate(db, { migrationsFolder })
await pool.end()

console.log('Migrations applied.')
