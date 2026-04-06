# Security notes (Squawk)

## Persisted request data

- **Saved requests** and **request history** store only **allowlisted** HTTP header names (e.g. `Accept`, `Content-Type`, `User-Agent`). Names are matched case-insensitively; everything else—including `Authorization`, `Cookie`, and arbitrary `X-*` headers—is **dropped** before insert. Implementation: `filterPersistableHeaders` in `apps/api/src/security/redactRequestHeaders.ts` (mirrored in `apps/web/src/lib/redactRequestHeaders.ts`). The server always re-filters client input.

- An **allowlist** is used instead of a blocklist so unknown or future sensitive header names are excluded by default.

## Field-level encryption

Application-level encryption of header blobs is **not** implemented. Postgres/Neon provides encryption at rest; avoiding storage of secrets in rows is the primary control. Adding envelope encryption would require a KMS-backed key hierarchy and rotation—only justified if a compliance requirement demands it.

## Deployment

Session cookies, CORS, OAuth, and API hardening for production hosts are documented in the deployment plan (e.g. `SameSite=None` for cross-origin `www` → `api`).

## Frontend

- **Content-Security-Policy** is injected as a `<meta>` tag only in **production** builds (`apps/web/vite.config.ts`). **`connect-src`** allows `https:` and `http:` so the HTTP client can send requests to user-entered URLs (same role as curl). The API origin from `VITE_API_URL` is also included when set. Dev mode omits CSP so Vite’s inline HMR/React preamble is not blocked. For `frame-ancestors`, set **HTTP response headers** on your CDN or origin (browsers ignore `frame-ancestors` in `<meta>`).
- **XSS:** No `dangerouslySetInnerHTML` in the app; React’s default escaping is used. Re-audit if rich HTML or markdown is added later.
- **Dependencies:** Run `npm audit` in CI; keep lockfiles committed and apply security updates regularly.
