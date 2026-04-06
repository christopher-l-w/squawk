import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { config } from 'dotenv'
import { serve } from '@hono/node-server'
import { createApp } from './app.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const apiRoot = path.join(__dirname, '..')
config({ path: path.join(apiRoot, '.env') })
config({ path: path.join(apiRoot, '..', '..', '.env') })

const port = Number(process.env.PORT) || 3001

const app = createApp()

serve(
  {
    fetch: app.fetch,
    port,
  },
  (info) => {
    console.log(`Listening on http://localhost:${info.port}`)
  },
)
