import { desc, eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'
import { getDb } from '../db/client.js'
import { requestHistory } from '../db/schema.js'
import { requireAuth, type AuthedEnv } from '../middleware/requireAuth.js'
import { parseJson } from './jsonBody.js'
import { filterPersistableHeaders } from '../security/redactRequestHeaders.js'

const headerRow = z.object({
  name: z.string(),
  value: z.string().default(''),
})

const createHistorySchema = z.object({
  method: z.string().min(1).max(16),
  url: z.string().min(1),
  headers: z.array(headerRow),
  body: z.string(),
  statusCode: z.number().int().nullable().optional(),
  durationMs: z.number().int().nullable().optional(),
  errorMessage: z.string().max(4000).nullable().optional(),
})

export function createHistoryRoutes() {
  const r = new Hono<AuthedEnv>()
  r.use('*', requireAuth)

  r.get('/', async (c) => {
    const userId = c.get('user').id
    const rawLimit = c.req.query('limit')
    const n = rawLimit ? Number.parseInt(rawLimit, 10) : 50
    const limit = Number.isFinite(n) ? Math.min(100, Math.max(1, n)) : 50

    const rows = await getDb()
      .select()
      .from(requestHistory)
      .where(eq(requestHistory.userId, userId))
      .orderBy(desc(requestHistory.createdAt))
      .limit(limit)

    return c.json({ items: rows })
  })

  r.post('/', async (c) => {
    const userId = c.get('user').id
    const parsed = await parseJson(c, createHistorySchema)
    if (!parsed.ok) return parsed.response

    const safeHeaders = filterPersistableHeaders(parsed.data.headers)

    const inserted = await getDb()
      .insert(requestHistory)
      .values({
        userId,
        method: parsed.data.method,
        url: parsed.data.url,
        requestHeaders: safeHeaders,
        requestBody: parsed.data.body,
        statusCode: parsed.data.statusCode ?? null,
        durationMs: parsed.data.durationMs ?? null,
        errorMessage: parsed.data.errorMessage ?? null,
      })
      .returning()

    const row = inserted[0]
    if (!row) return c.json({ error: 'Create failed' }, 500)
    return c.json({ item: row }, 201)
  })

  return r
}
