import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')
  const apiOrigin = (() => {
    try {
      const u = env.VITE_API_URL
      if (!u) return ''
      return new URL(u).origin
    } catch {
      return ''
    }
  })()

  const connectParts = ["'self'"]
  if (apiOrigin) connectParts.push(apiOrigin)

  // CSP via <meta> only in production builds. In dev, Vite injects inline scripts
  // (React Fast Refresh preamble, HMR) that would violate script-src 'self'.
  // frame-ancestors is ignored in <meta> anyway — set it on CDN/HTTP headers in prod.
  const cspProduction = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    `connect-src ${connectParts.join(' ')}`,
    "img-src 'self' data:",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ')

  const cspEscaped = cspProduction
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')

  return {
    plugins: [
      react(),
      ...(mode === 'production'
        ? [
            {
              name: 'html-csp',
              transformIndexHtml(html: string) {
                return html.replace(
                  '<head>',
                  `<head>\n    <meta http-equiv="Content-Security-Policy" content="${cspEscaped}" />`,
                )
              },
            },
          ]
        : []),
    ],
  }
})
