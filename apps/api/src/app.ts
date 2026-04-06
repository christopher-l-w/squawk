import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { checkDatabase } from './db/health.js'
import { createAuthRoutes } from './routes/auth.js'
import { createHistoryRoutes } from './routes/historyRoutes.js'
import { createOAuthRoutes } from './routes/oauthRoutes.js'
import { createSavedRequestsRoutes } from './routes/savedRequests.js'
import { corsOriginOption } from './webOrigin.js'

export function createApp() {
  const app = new Hono()

  app.use(
    '/*',
    cors({
      origin: corsOriginOption(),
      allowHeaders: ['Content-Type', 'Cookie'],
      exposeHeaders: ['Set-Cookie'],
      credentials: true,
    }),
  )

  app.get('/health', (c) => c.json({ status: 'ok' }))

  app.get('/ready', async (c) => {
    const ok = await checkDatabase()
    if (!ok) {
      return c.json({ status: 'unavailable', database: 'down' }, 503)
    }
    return c.json({ status: 'ready', database: 'up' })
  })

  const v1 = new Hono()
  v1.route('/auth', createAuthRoutes())
  v1.route('/auth/oauth', createOAuthRoutes())
  v1.route('/saved-requests', createSavedRequestsRoutes())
  v1.route('/history', createHistoryRoutes())
  app.route('/v1', v1)

  return app
}
