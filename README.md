# squawk

Browser-based HTTP client (“curl with a UI”): compose a method, URL, headers, and body, send the request, and inspect status, timing, headers, and body. Phase 1 is intentionally stateless—nothing is saved to disk.

## Requirements

- [Node.js](https://nodejs.org/) 20+ (CI uses 22)

## Setup

```bash
npm ci
```

## Scripts (run from repo root)

| Script            | Description                                      |
| ----------------- | ------------------------------------------------ |
| `npm run dev`     | Start Vite dev server for `apps/web`             |
| `npm run build`   | Typecheck and production build                   |
| `npm run test`    | Vitest (unit + component tests)                  |
| `npm run lint`    | ESLint                                           |
| `npm run format`  | Prettier write                                   |
| `npm run format:check` | Prettier check only                         |
| `npm run preview` | Preview production build locally                 |

## Project layout

- [`apps/web`](apps/web) — Vite + React + TypeScript SPA
- [`apps/web/src/lib/http`](apps/web/src/lib/http) — Request building, `fetch` execution, response shaping (testable without the UI)
- [`apps/web/src/hooks`](apps/web/src/hooks) — `useHttpRequest` wires form state to the executor
- [`apps/web/src/components`](apps/web/src/components) — Request and response panels

## CORS

Browsers only allow `fetch` to other origins if that API sends appropriate CORS headers. Many public APIs will work; many private or legacy APIs will fail from `localhost` until a same-origin **proxy** exists (a future backend can provide that).

## Roadmap

- TypeScript API and SQL persistence
- Authentication
- Saved requests and history (server-backed)
