import { sql } from 'drizzle-orm'
import {
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'

/**
 * Authenticated users. `passwordHash` is null until email/password auth is wired.
 */
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }),
  /** Shown in the UI when set (e.g. Google "name"); falls back to email. */
  displayName: varchar('display_name', { length: 255 }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
})

/** Opaque session tokens are hashed (SHA-256 hex) and stored here; raw token lives only in httpOnly cookie. */
export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  tokenHash: varchar('token_hash', { length: 64 }).notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
})

/** Links a user to an OAuth provider (e.g. Google `sub`). */
export const oauthAccounts = pgTable(
  'oauth_accounts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    provider: varchar('provider', { length: 32 }).notNull(),
    providerSubject: text('provider_subject').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex('oauth_accounts_provider_subject_unique').on(
      t.provider,
      t.providerSubject,
    ),
  ],
)

export const savedRequests = pgTable('saved_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  method: varchar('method', { length: 16 }).notNull(),
  url: text('url').notNull(),
  /** Only allowlisted header names are persisted (see filterPersistableHeaders). */
  headers: jsonb('headers')
    .$type<{ name: string; value: string }[]>()
    .notNull()
    .default(sql`'[]'::jsonb`),
  body: text('body').notNull().default(''),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
})

export const requestHistory = pgTable('request_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  method: varchar('method', { length: 16 }).notNull(),
  url: text('url').notNull(),
  requestHeaders: jsonb('request_headers')
    .$type<{ name: string; value: string }[]>()
    .notNull()
    .default(sql`'[]'::jsonb`),
  requestBody: text('request_body').notNull().default(''),
  statusCode: integer('status_code'),
  durationMs: integer('duration_ms'),
  /** Set when the browser could not complete a response (e.g. CORS, network). */
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
})
