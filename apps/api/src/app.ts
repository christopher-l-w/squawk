import { Hono } from 'hono'
import { checkDatabase } from './db/health.js'

export function createApp() {
  const app = new Hono()

  app.get('/health', (c) => c.json({ status: 'ok' }))

  app.get('/ready', async (c) => {
    const ok = await checkDatabase()
    if (!ok) {
      return c.json({ status: 'unavailable', database: 'down' }, 503)
    }
    return c.json({ status: 'ready', database: 'up' })
  })

  return app
}
