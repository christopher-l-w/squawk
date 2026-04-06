/**
 * Must match apps/api/src/security/redactRequestHeaders.ts (allowlist).
 */
const PERSISTABLE_HEADER_NAMES_RAW = [
  'accept',
  'accept-charset',
  'accept-encoding',
  'accept-language',
  'cache-control',
  'content-type',
  'user-agent',
  'pragma',
  'x-request-id',
] as const

const PERSISTABLE_HEADER_NAMES = new Set(
  [...PERSISTABLE_HEADER_NAMES_RAW].map((s) => s.toLowerCase()),
)

/** HTTP-style labels for UI (e.g. `Content-Type`, `X-Request-Id`). */
function formatPersistableHeaderLabel(kebabLower: string): string {
  return kebabLower
    .split('-')
    .map((seg, i) => {
      if (i === 0 && seg === 'x') return 'X'
      return seg.charAt(0).toUpperCase() + seg.slice(1).toLowerCase()
    })
    .join('-')
}

/**
 * Sorted list of header names that may be persisted — for modals / docs.
 * Keep in sync with `PERSISTABLE_HEADER_NAMES_RAW`.
 */
export const PERSISTABLE_HEADER_LABELS: readonly string[] = Object.freeze(
  [...PERSISTABLE_HEADER_NAMES_RAW]
    .map((name) => formatPersistableHeaderLabel(name))
    .sort((a, b) => a.localeCompare(b)),
)

function isPersistableHeaderName(name: string): boolean {
  return PERSISTABLE_HEADER_NAMES.has(name.trim().toLowerCase())
}

export function filterPersistableHeaders(
  headers: readonly { name: string; value: string }[],
): { name: string; value: string }[] {
  return headers.filter((h) => isPersistableHeaderName(h.name))
}

/**
 * Header rows with a non-empty name that will not be persisted (not on the allowlist).
 * Used to warn before saving; values are not shown in UI copy.
 */
export function getHeadersNotPersisted(
  headers: readonly { name: string; value: string }[],
): { name: string; value: string }[] {
  return headers.filter(
    (h) => h.name.trim().length > 0 && !isPersistableHeaderName(h.name),
  )
}
