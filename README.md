# SAP

npm-workspaces monorepo with a Next.js frontend and a NestJS backend.

## Structure

| Path       | Description                                                   |
| ---------- | ------------------------------------------------------------- |
| `apps/web` | Next.js 16 / React 19 / Tailwind 4 frontend (App Router, FSD) |
| `apps/api` | NestJS 12 backend (ESM, Prisma, Vitest)                       |
| `docs`     | Project documentation                                         |

The browser only talks to `apps/web`. Next rewrites `/api/*` to the API (`API_URL`, default `http://localhost:3003`), so requests are same-origin and the API's httpOnly `access-token` cookie works.

See `apps/web/CLAUDE.md` and `apps/api/CLAUDE.md` for per-app details.

## Getting started

```bash
npm install
cp .env.example .env
docker compose up -d db   # PostgreSQL 17 on localhost:5436 (sap/sap/sap by default)
npm run dev:api           # API on http://localhost:3003
npm run dev:web           # Web on http://localhost:3000
```

## Scripts

| Command                | Description                            |
| ---------------------- | -------------------------------------- |
| `npm run dev:web`      | Start the web dev server               |
| `npm run dev:api`      | Start the API dev server (watch mode)  |
| `npm run build`        | Build web, then api                    |
| `npm run lint`         | Lint both apps (api runs with `--fix`) |
| `npm run format`       | Prettier across `apps/**`              |
| `npm run test:api`     | API unit tests                         |
| `npm run test:e2e:api` | API e2e tests                          |

## Conventions

- Prettier: single quotes, trailing commas everywhere.
- TypeScript throughout.
- Install dependencies with `npm i <pkg> -w <web|api>`.
- Frontend follows Feature-Sliced Design.
