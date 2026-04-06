/**
 * Pretty-print JSON when the payload parses; otherwise return as-is.
 */
export function formatBodyForDisplay(raw: string): {
  formatted: string
  isJson: boolean
} {
  const trimmed = raw.trim()
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
    return { formatted: raw, isJson: false }
  }
  try {
    const parsed = JSON.parse(raw) as unknown
    return {
      formatted: JSON.stringify(parsed, null, 2),
      isJson: true,
    }
  } catch {
    return { formatted: raw, isJson: false }
  }
}
