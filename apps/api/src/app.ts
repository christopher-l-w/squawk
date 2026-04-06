import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { checkDatabase } from './db/health.js'
import { createAuthRoutes } from './routes/auth.js'
import { createHistoryRoutes } from './routes/historyRoutes.js'
import { createOAuthRoutes } from './routes/oauthRoutes.js'
import { createSavedRequestsRoutes } from './routes/savedRequests.js'

const webOrigin = process.env.WEB_ORIGIN ?? 'http://localhost:5173'

export function createApp() {
  const app = new Hono()

  app.use(
    '/*',
    cors({
      origin: webOrigin,
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

  app.route('/auth', createAuthRoutes())
  app.route('/auth/oauth', createOAuthRoutes())
  app.route('/saved-requests', createSavedRequestsRoutes())
  app.route('/history', createHistoryRoutes())

  return app
}
