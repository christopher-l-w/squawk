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

**Auth + CORS:** Keep `WEB_ORIGIN` in the root `.env` aligned with the Vite dev origin (`http://localhost:5173`). Set `VITE_API_URL` in `apps/web/.env` to your API base URL (e.g. `http://localhost:3001`).

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

Set `PORT` if the platform injects one. Optional Google OAuth: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` (must match your API’s public URL and Google Cloud redirect URIs).

Check `GET /health` (liveness) and `GET /ready` (returns **503** if the DB is unreachable).

### 3. Web (static hosting)

`VITE_API_URL` is **baked in at build time**. Set it in CI or locally to your **public API base URL** (no trailing slash), then build:

```bash
cd apps/web && VITE_API_URL="https://api.yourdomain.com" npm run build
```

Upload `apps/web/dist` to Netlify, Vercel, S3+CloudFront, etc. Configure the host to **serve `index.html` for unknown paths** (SPA fallback) so `/login` works on refresh.

| Variable | Where | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | API | Postgres connection string |
| `NODE_ENV` | API | Use `production` for secure cookies |
| `PORT` | API | Listen port (default `3001`) |
| `WEB_ORIGIN` | API | Exact browser origin allowed by CORS (your deployed SPA URL) |
| `VITE_API_URL` | Web **build** | Public API URL the SPA calls |
| `GOOGLE_*` | API | Optional; see below |

## Project layout

- [`apps/web`](apps/web) — Vite + React + TypeScript SPA (`react-router-dom`: `/`, `/login`)
- [`apps/api`](apps/api) — Hono HTTP server, Drizzle ORM, `pg` driver
- [`apps/api/src/db`](apps/api/src/db) — Schema and DB client
- [`apps/api/drizzle`](apps/api/drizzle) — Generated SQL migrations
- [`docker-compose.yml`](docker-compose.yml) — PostgreSQL 16 for local development

### API endpoints

- `GET /health` — process liveness
- `GET /ready` — readiness; returns **503** if `DATABASE_URL` is missing or the DB is unreachable
- `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me` — session cookie auth (`squawk_session` httpOnly cookie)
- `GET /auth/oauth/providers` — JSON `{ google: boolean }` (whether Google OAuth env vars are set)
- `GET /auth/oauth/google` → Google consent, then `GET /auth/oauth/google/callback` — Sign in with Google
- `GET /saved-requests`, `POST /saved-requests`, `PATCH /saved-requests/:id`, `DELETE /saved-requests/:id` — named saved HTTP requests (requires session)
- `GET /history?limit=…`, `POST /history` — append and list recent request snapshots for the signed-in user (requires session)

After pulling schema changes, run `npm run db:migrate` (e.g. `request_history` snapshot columns, `oauth_accounts` for social login).

The HTTP client UI still sends `fetch` to **whatever URL you type**; it does not proxy through the API. Third-party APIs may still hit **CORS** limits until a same-origin proxy exists.

### Production reminder (OAuth / Google)

Before pointing real users at a deployed Squawk:

1. **Google Cloud OAuth client** — Add your **production** API base URL to **Authorized redirect URIs**, e.g. `https://api.yourdomain.com/auth/oauth/google/callback`, and set **`GOOGLE_REDIRECT_URI`** in the API environment to that exact URL. Use **HTTPS** for the live API; align **`WEB_ORIGIN`** and **`VITE_API_URL`** with your real web and API URLs.
2. **OAuth consent screen** — In [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services** → **OAuth consent screen**, move from **Testing** to **In production** when you are ready for users outside any test-user list.
3. **Verification** — If your app uses restricted or sensitive scopes, or you need broad public sign-in, Google may require **[app verification](https://support.google.com/cloud/answer/9110914)** (privacy policy, branding, review). Plan time for that before launch; internal/testing-only usage can stay in **Testing** with explicit test users.

## Roadmap

- Optional API proxy route to reduce CORS issues for saved flows
