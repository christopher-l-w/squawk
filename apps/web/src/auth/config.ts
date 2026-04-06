/** Base URL for the Squawk API (no trailing slash). May include `/v1` (e.g. `https://api.example.com/v1`). */
export function getApiBaseUrl(): string {
  const raw = import.meta.env.VITE_API_URL
  if (typeof raw !== 'string' || !raw.trim()) {
    return ''
  }
  return raw.replace(/\/$/, '')
}
