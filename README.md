# squawk

Browser-based HTTP client (“curl with a UI”) plus a **TypeScript API**, **PostgreSQL**, and **email/password authentication** (session cookies).

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

Run the UI and API in two terminals:

```bash
npm run dev:api
npm run dev
```

## Scripts (repo root)

| Script | Description |
| --- | --- |
| `npm run dev` | Vite dev server (`apps/web`) |
| `npm run dev:api` | API dev server (`apps/api`, default port **3001**) |
| `npm run build` | Production build: web + API |
| `npm test` | Vitest: web + API |
| `npm run lint` | ESLint: web + API |
| `npm run format` / `npm run format:check` | Prettier |
| `npm run docker:up` | Start Postgres (`docker compose up -d`) |
| `npm run docker:down` | Stop Compose services |
| `npm run db:migrate` | Apply Drizzle SQL migrations to `DATABASE_URL` |
| `npm run db:studio` | [Drizzle Studio](https://orm.drizzle.team/docs/drizzle-kit-studio) (inspect DB) |

## Project layout

- [`apps/web`](apps/web) — Vite + React + TypeScript SPA
- [`apps/api`](apps/api) — Hono HTTP server, Drizzle ORM, `pg` driver
- [`apps/api/src/db`](apps/api/src/db) — Schema and DB client
- [`apps/api/drizzle`](apps/api/drizzle) — Generated SQL migrations
- [`docker-compose.yml`](docker-compose.yml) — PostgreSQL 16 for local development

### API endpoints

- `GET /health` — process liveness
- `GET /ready` — readiness; returns **503** if `DATABASE_URL` is missing or the DB is unreachable
- `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me` — session cookie auth (`squawk_session` httpOnly cookie)

The HTTP client UI still sends `fetch` to **whatever URL you type**; it does not proxy through the API. Third-party APIs may still hit **CORS** limits until a same-origin proxy exists.

## Roadmap

- CRUD for saved requests and history (tables already in [`schema.ts`](apps/api/src/db/schema.ts))
- Optional API proxy route to reduce CORS issues for saved flows
