# squawk

Browser-based HTTP client (“curl with a UI”) plus a **TypeScript API**, **PostgreSQL**, and authentication (**email/password** and optional **Sign in with Google**, session cookies).

## Requirements

- [Node.js](https://nodejs.org/) 20+ (CI uses 22)
- [Docker](https://docs.docker.com/get-docker/) (recommended) — runs PostgreSQL locally via Compose

## Setup

```bash
npm ci
cp .env.example .env
cp apps/web/.env.example apps/web/.env
docker compose up -d
npm run db:migrate
```

The default `DATABASE_URL` in `.env.example` matches the Compose service (`squawk` / `squawk` / database `squawk` on port `5432`).

**Auth + CORS:** Keep `WEB_ORIGIN` in the root `.env` aligned with the Vite dev origin (`http://localhost:5173`). Set `VITE_API_URL` in `apps/web/.env` to your API base URL including the **`/v1` prefix** (e.g. `http://localhost:3001/v1`).

**OAuth (optional):** Uncomment and set `GOOGLE_*` in the root `.env` (see [`.env.example`](.env.example)) and register the redirect URI in Google Cloud. Run `npm run db:migrate` so the `oauth_accounts` table exists.

Run the UI and API in two terminals:

```bash
npm run dev:api
npm run dev:web
```

The web app is a SPA with client-side routing: **`/`** is the HTTP client, **`/login`** is the sign-in / register page. For production, configure your static host to **fallback to `index.html`** for unknown paths so deep links like `/login` load the app (the Vite dev server does this automatically).

## Scripts (repo root)

| Script | Description |
| --- | --- |
| `npm run dev:web` | Vite dev server (`apps/web`) |
| `npm run dev:api` | API dev server (`apps/api`, default port **3001**) |
| `npm run build` | Production build: web + API |
| `npm run build:web` | Production build: web only ([`apps/web`](apps/web)) |
| `npm test` | Vitest: web + API |
| `npm run lint` | ESLint: web + API |
| `npm run format` / `npm run format:check` | Prettier |
| `npm run docker:up` | Start Postgres (`docker compose up -d`) |
| `npm run docker:down` | Stop Compose services |
| `npm run docker:build-api` | Build production API Docker image ([`Dockerfile`](Dockerfile)) |
| `npm run db:migrate` | Apply Drizzle SQL migrations to `DATABASE_URL` |
| `npm run db:studio` | [Drizzle Studio](https://orm.drizzle.team/docs/drizzle-kit-studio) (inspect DB) |

## Deploy

Squawk is two pieces: the **API** (Node, e.g. Docker or any Node 22 host) and the **static web app** (Vite build). Use **HTTPS** in production. Prefer **same registrable domain** for web + API (e.g. `www` + `api` subdomains) or a **single origin** with a reverse proxy so session cookies and CORS match [`WEB_ORIGIN`](.env.example) (see [`SECURITY.md`](SECURITY.md)).

### 1. Database (e.g. Neon)

Create a Postgres instance and set `DATABASE_URL` (Neon’s URI usually includes `?sslmode=require`). **Before** the API serves traffic, apply migrations from your machine or CI (same repo, same `DATABASE_URL`):

```bash
DATABASE_URL="postgresql://…" npm run db:migrate
```

### 2. API (Docker)

A multi-stage [`Dockerfile`](Dockerfile) at the repo root builds only the API:

```bash
docker build -t squawk-api .
docker run --rm -p 3001:3001 \
  -e NODE_ENV=production \
  -e DATABASE_URL="postgresql://…" \
  -e WEB_ORIGIN="https://your-web-origin.example" \
  squawk-api
```

Set `PORT` if the platform injects one. Optional Google OAuth: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` (must match **`…/v1/auth/oauth/google/callback`** and Google Cloud redirect URIs).

Check `GET /health` (liveness) and `GET /ready` (returns **503** if the DB is unreachable).

### 3. Web (static hosting)

**Terraform and AWS resources for the Squawk UI** (S3, CloudFront, Route53 for `squawk.<domain>`, IAM deploy role) live in **[infra-static-site](https://github.com/christopher-l-w/infra-static-site)** under `terraform/sites/christopherw/` — not in this repo. The **[christopherw](https://github.com/christopher-l-w/christopherw)** repo’s [INFRA.md](https://github.com/christopher-l-w/christopherw/blob/main/INFRA.md) describes the same **GitHub Actions OIDC → S3 + CloudFront invalidation** pattern this app uses.

After `terraform apply` in `infra-static-site` for the `squawk_spa` module, set the API **`WEB_ORIGIN`** on Railway to your deployed SPA origin (e.g. **`https://squawk.christopherw.ca`**) so CORS and cookies match.

**Production build locally**

```bash
cp apps/web/.env.production.example apps/web/.env.production
# Edit VITE_API_URL if needed, then:
npm run build:web
```

Output is `apps/web/dist/`.

**GitHub Actions deploy** ([`.github/workflows/deploy-web.yml`](.github/workflows/deploy-web.yml)) runs on push to `main` when `apps/web/**` changes. Configure the **squawk** repository (same idea as christopherw):

| | |
| --- | --- |
| **Secret** | `AWS_DEPLOY_ROLE_ARN` — IAM role ARN from Terraform output `deploy_role_arn` (same role as the landing site; it trusts both repos). |
| **Variables** | `AWS_S3_BUCKET`, `AWS_CLOUDFRONT_DISTRIBUTION_ID` — use `squawk_spa_s3_bucket_id` and `squawk_spa_cloudfront_distribution_id` from Terraform outputs. |
| **Variables** | `VITE_API_URL` — e.g. `https://api.christopherw.ca/v1` |

**Other hosts (Netlify, Vercel, etc.)** — Build with `npm run build:web`, set `VITE_API_URL`, and enable SPA fallback to `index.html`.

| Variable | Where | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | API | Postgres connection string |
| `NODE_ENV` | API | Use `production` for secure cookies |
| `PORT` | API | Listen port (default `3001`) |
| `WEB_ORIGIN` | API | Browser origin allowed by CORS (your deployed SPA URL). Comma-separated list if you enable both apex and `www`; see [Optional `www` subdomain](#optional-www-subdomain) |
| `VITE_API_URL` | Web **build** | Public API base URL the SPA calls, including **`/v1`** (no trailing slash after `v1`) |
| `GOOGLE_*` | API | Optional; [Sign in with Google](#sign-in-with-google-production) only appears when **all three** are set on the API |

### Sign in with Google (production)

The login page loads **`GET /v1/auth/oauth/providers`** and shows **Sign in with Google** only when the response is `{"google":true}`. The API sets that to `true` only when **all** of these environment variables are non-empty on the API host (e.g. Railway):

| Variable | Notes |
| --- | --- |
| `GOOGLE_CLIENT_ID` | OAuth 2.0 Client ID from [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services** → **Credentials** |
| `GOOGLE_CLIENT_SECRET` | Client secret for the same OAuth client |
| `GOOGLE_REDIRECT_URI` | Must match **exactly** the callback URL the API serves, e.g. **`https://api.christopherw.ca/v1/auth/oauth/google/callback`** (scheme, host, path, no trailing slash) |

**Google Cloud:** For that OAuth client, add the **same** URL under **Authorized redirect URIs**.

After setting or changing these variables, **redeploy the API** so the process picks them up.

**Sanity check** (should return `{"google":true}` when configured):

```bash
curl -sS "https://api.christopherw.ca/v1/auth/oauth/providers"
```

If you see `{"google":false}`, at least one variable is missing, empty, or the deployment is stale.

**Consent screen:** For users outside a test-user list, the OAuth consent screen may need to be **In production**; sensitive scopes can require [Google verification](https://support.google.com/cloud/answer/9110914). See also the [Production reminder](#production-reminder-oauth--google) below.

**If Google sign-in fails after you pick a Google account:** You are redirected back to `/login?error=…`. Common cases:

| `error` | Likely cause |
| --- | --- |
| `oauth_state` | The short-lived OAuth cookies did not reach the callback (blocked, wrong domain, or expired). Retry; confirm the API URL is **HTTPS** and matches your Railway custom domain. |
| `oauth_failed` | Usually **`GOOGLE_REDIRECT_URI`** does not match **Authorized redirect URIs** in Google Cloud **exactly** (copy-paste both; no trailing slash; same host as in the browser). Check API logs for `[oauth]` lines after redeploying. |
| `oauth_email` / `oauth_profile` | Google did not return email/profile; consent screen or scopes. |

**Repo-only changes are not always enough:** You must align **Railway env**, **Google Cloud redirect URIs**, and **`WEB_ORIGIN`** (first origin for post-login redirect). After changing env vars, **redeploy** the API. Pushing this repo helps when we ship cookie / trimming fixes; they are not a substitute for a mismatched redirect URI in Google Cloud.

### Optional `www` subdomain

Production is set up for **`https://squawk.<your-domain>`** only (no `www.squawk.…`). That matches **`include_www = false`** on `module.squawk_spa` in **[infra-static-site](https://github.com/christopher-l-w/infra-static-site)** (`terraform/sites/christopherw/main.tf`), which keeps ACM, CloudFront, and Route53 simpler.

To **add** `https://www.squawk.<your-domain>` later:

1. **Terraform** — Set **`include_www = true`** on `module.squawk_spa`, run **`terraform apply`**, and wait for the certificate (new SAN + DNS validation) and distribution updates. If you had previously applied with `www`, turning it **off** again removes that hostname from AWS.
2. **API** — Set **`WEB_ORIGIN`** to a **comma-separated** list, **apex first** if that should stay the canonical URL for OAuth redirects, e.g. `https://squawk.example.com,https://www.squawk.example.com`. The API already parses this ([`apps/api/src/webOrigin.ts`](apps/api/src/webOrigin.ts)).
3. **Redeploy** the API so the new `WEB_ORIGIN` is live.

## Project layout

- [`apps/web`](apps/web) — Vite + React + TypeScript SPA (`react-router-dom`: `/`, `/login`)
- [`apps/api`](apps/api) — Hono HTTP server, Drizzle ORM, `pg` driver
- [`apps/api/src/db`](apps/api/src/db) — Schema and DB client
- [`apps/api/drizzle`](apps/api/drizzle) — Generated SQL migrations
- [`docker-compose.yml`](docker-compose.yml) — PostgreSQL 16 for local development

### API endpoints

Versioned routes live under **`/v1`**. **`GET /health`** and **`GET /ready`** are at the **host root** (for load balancer probes).

- `GET /health` — process liveness
- `GET /ready` — readiness; returns **503** if `DATABASE_URL` is missing or the DB is unreachable
- `POST /v1/auth/register`, `POST /v1/auth/login`, `POST /v1/auth/logout`, `GET /v1/auth/me` — session cookie auth (`squawk_session` httpOnly cookie)
- `GET /v1/auth/oauth/providers` — JSON `{ google: boolean }` (whether Google OAuth env vars are set)
- `GET /v1/auth/oauth/google` → Google consent, then `GET /v1/auth/oauth/google/callback` — Sign in with Google
- `GET /v1/saved-requests`, `POST /v1/saved-requests`, `PATCH /v1/saved-requests/:id`, `DELETE /v1/saved-requests/:id` — named saved HTTP requests (requires session)
- `GET /v1/history?limit=…`, `POST /v1/history` — append and list recent request snapshots for the signed-in user (requires session)

After pulling schema changes, run `npm run db:migrate` (e.g. `request_history` snapshot columns, `oauth_accounts` for social login).

The HTTP client UI still sends `fetch` to **whatever URL you type**; it does not proxy through the API. Third-party APIs may still hit **CORS** limits until a same-origin proxy exists.

### Production reminder (OAuth / Google)

Before pointing real users at a deployed Squawk, configure **`GOOGLE_*`** as in [Sign in with Google (production)](#sign-in-with-google-production). Additionally:

1. **OAuth consent screen** — In [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services** → **OAuth consent screen**, move from **Testing** to **In production** when you are ready for users outside any test-user list.
2. **Verification** — If your app uses restricted or sensitive scopes, or you need broad public sign-in, Google may require **[app verification](https://support.google.com/cloud/answer/9110914)** (privacy policy, branding, review). Plan time for that before launch; internal/testing-only usage can stay in **Testing** with explicit test users.

## Roadmap

- Optional API proxy route to reduce CORS issues for saved flows
