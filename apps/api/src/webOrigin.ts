/** Comma-separated browser origins allowed for CORS; first entry is canonical (OAuth redirects). */
export function parseWebOrigins(): string[] {
  const raw = process.env.WEB_ORIGIN ?? 'http://localhost:5173'
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

export function primaryWebOrigin(): string {
  const o = parseWebOrigins()
  return o[0] ?? 'http://localhost:5173'
}

export function corsOriginOption(): string | string[] {
  const o = parseWebOrigins()
  if (o.length === 0) return 'http://localhost:5173'
  if (o.length === 1) return o[0]
  return o
}
