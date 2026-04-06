import type { MiddlewareHandler } from 'hono'
import type { AuthUser } from '../auth/sessionService.js'
import { getSessionUser } from '../auth/sessionService.js'

export type AuthedEnv = {
  Variables: {
    user: AuthUser
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
