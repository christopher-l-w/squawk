import type { MiddlewareHandler } from 'hono'
import { getSessionUser } from '../auth/sessionService.js'

export type AuthedEnv = {
  Variables: {
    user: { id: string; email: string }
  }
}

export const requireAuth: MiddlewareHandler<AuthedEnv> = async (c, next) => {
  const user = await getSessionUser(c)
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  c.set('user', user)
  await next()
}
