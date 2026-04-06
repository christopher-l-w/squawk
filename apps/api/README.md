# api

Hono + Drizzle + PostgreSQL. Copy the repo [`.env.example`](../../.env.example) to the repo root or `apps/api/.env` as `.env` and set `DATABASE_URL`.

```bash
# from repo root
docker compose up -d
npm run db:migrate
npm run dev:api
```

See the [repository README](../../README.md) for the full script list.
