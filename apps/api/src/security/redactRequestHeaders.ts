/**
 * Only these header **names** may be persisted (saved requests + history).
 * Case-insensitive match; everything else is dropped so secrets (Authorization,
 * cookies, API keys, arbitrary X-* auth headers) never reach the database.
 *
 * Allowlist is stricter than a blocklist: unknown or future sensitive names are excluded by default.
 */
const PERSISTABLE_HEADER_NAMES = new Set(
  [
    'accept',
    'accept-charset',
    'accept-encoding',
    'accept-language',
    'cache-control',
    'content-type',
    'user-agent',
    'pragma',
    'x-request-id',
  ].map((s) => s.toLowerCase()),
)

function isPersistableHeaderName(name: string): boolean {
  return PERSISTABLE_HEADER_NAMES.has(name.trim().toLowerCase())
}

/**
 * Headers safe to store in Postgres (saved requests + request history).
 * `value` may be missing on input (Zod defaults apply at parse time but types
 * can still be optional); normalized to `''` in the result.
 */
export function filterPersistableHeaders(
  headers: readonly { name: string; value?: string | undefined }[],
): { name: string; value: string }[] {
  return headers
    .filter((h) => isPersistableHeaderName(h.name))
    .map((h) => ({ name: h.name, value: h.value ?? '' }))
}
