import { and, desc, eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'
import { getDb } from '../db/client.js'
import { savedRequests } from '../db/schema.js'
import { requireAuth, type AuthedEnv } from '../middleware/requireAuth.js'
import { parseJson } from './jsonBody.js'

const headerRow = z.object({ name: z.string(), value: z.string() })

const createSavedSchema = z.object({
  name: z.string().min(1).max(255),
  method: z.string().min(1).max(16),
  url: z.string().min(1),
  headers: z.array(headerRow),
  body: z.string(),
})

const patchSavedSchema = z
  .object({
    name: z.string().min(1).max(255).optional(),
    method: z.string().min(1).max(16).optional(),
    url: z.string().min(1).optional(),
    headers: z.array(headerRow).optional(),
    body: z.string().optional(),
  })
  .refine((o) => Object.keys(o).length > 0, {
    message: 'At least one field required',
  })

export function createSavedRequestsRoutes() {
  const r = new Hono<AuthedEnv>()
  r.use('*', requireAuth)

  r.get('/', async (c) => {
    const userId = c.get('user').id
    const rows = await getDb()
      .select()
      .from(savedRequests)
      .where(eq(savedRequests.userId, userId))
      .orderBy(desc(savedRequests.updatedAt))

    return c.json({ items: rows })
  })

  r.post('/', async (c) => {
    const userId = c.get('user').id
    const parsed = await parseJson(c, createSavedSchema)
    if (!parsed.ok) return parsed.response

    const inserted = await getDb()
      .insert(savedRequests)
      .values({
        userId,
        name: parsed.data.name,
        method: parsed.data.method,
        url: parsed.data.url,
        headers: parsed.data.headers,
        body: parsed.data.body,
      })
      .returning()

    const row = inserted[0]
    if (!row) return c.json({ error: 'Create failed' }, 500)
    return c.json({ item: row }, 201)
  })

  r.patch('/:id', async (c) => {
    const userId = c.get('user').id
    const id = c.req.param('id')
    if (!z.string().uuid().safeParse(id).success) {
      return c.json({ error: 'Invalid id' }, 400)
    }

    const parsed = await parseJson(c, patchSavedSchema)
    if (!parsed.ok) return parsed.response

    const p = parsed.data
    const updated = await getDb()
      .update(savedRequests)
      .set({
        ...(p.name !== undefined ? { name: p.name } : {}),
        ...(p.method !== undefined ? { method: p.method } : {}),
        ...(p.url !== undefined ? { url: p.url } : {}),
        ...(p.headers !== undefined ? { headers: p.headers } : {}),
        ...(p.body !== undefined ? { body: p.body } : {}),
        updatedAt: new Date(),
      })
      .where(and(eq(savedRequests.id, id), eq(savedRequests.userId, userId)))
      .returning()

    const row = updated[0]
    if (!row) return c.json({ error: 'Not found' }, 404)
    return c.json({ item: row })
  })

  r.delete('/:id', async (c) => {
    const userId = c.get('user').id
    const id = c.req.param('id')
    if (!z.string().uuid().safeParse(id).success) {
      return c.json({ error: 'Invalid id' }, 400)
    }

    const deleted = await getDb()
      .delete(savedRequests)
      .where(and(eq(savedRequests.id, id), eq(savedRequests.userId, userId)))
      .returning({ id: savedRequests.id })

    if (!deleted.length) return c.json({ error: 'Not found' }, 404)
    return c.json({ ok: true })
  })

  return r
}
