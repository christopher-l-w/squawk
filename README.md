# squawk

Browser-based HTTP client (“curl with a UI”) plus a **TypeScript API** and **PostgreSQL** for upcoming auth, saved requests, and history.

## Requirements

- [Node.js](https://nodejs.org/) 20+ (CI uses 22)
- [Docker](https://docs.docker.com/get-docker/) (recommended) — runs PostgreSQL locally via Compose

## Setup

```bash
npm ci
cp .env.example .env
docker compose up -d
npm run db:migrate
```

The default `DATABASE_URL` in `.env.example` matches the Compose service (`squawk` / `squawk` / database `squawk` on port `5432`).

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

### API endpoints (Phase 2 foundation)

- `GET /health` — process liveness
- `GET /ready` — readiness; returns **503** if `DATABASE_URL` is missing or the DB is unreachable

## CORS

The SPA still talks to third-party APIs directly from the browser; many targets need a **same-origin proxy** later. When the API grows, it can host a proxy route and CORS for the web origin.

## Roadmap

- Authentication (sessions or JWT)
- CRUD for saved requests and history using the tables in [`schema.ts`](apps/api/src/db/schema.ts)
