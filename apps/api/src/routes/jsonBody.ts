import type { Context } from 'hono'
import type { z } from 'zod'

export async function parseJson<T>(
  c: Context,
  schema: z.ZodType<T>,
): Promise<
  { ok: true; data: T } | { ok: false; response: Response }
> {
  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return { ok: false, response: c.json({ error: 'Invalid JSON' }, 400) }
  }
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return {
      ok: false,
      response: c.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        400,
      ),
    }
  }
  return { ok: true, data: parsed.data }
}
