# CLAUDE.md

npm-workspaces monorepo (`apps/*`). Run commands from the repo root unless noted.

## Layout

- `apps/web` — Next.js 16 / React 19 / Tailwind 4 frontend (App Router, `app/`). See `apps/web/CLAUDE.md`.
- `apps/api` — NestJS 12 backend (ESM, Vitest). See `apps/api/CLAUDE.md`.

## Commands

- `npm run dev:web` / `npm run dev:api` — dev servers
- `npm run build` — build web, then api
- `npm run lint` — lint both apps (api lint runs with `--fix`)
- `npm run format` — Prettier across `apps/**`

## Conventions

- Prettier: single quotes, trailing commas everywhere (`.prettierrc`).
- TypeScript throughout. Install deps with `npm i <pkg> -w <web|api>`.
- Each app has an `AGENTS.md` with framework-specific rules; read it before working there.
- `DRAFT.md` holds project notes/drafts.

## Documentation

When the project architecture changes (new/removed modules or apps, changed data flow, new external services, major dependency or tooling swaps, changed folder structure), update the relevant documentation in the same change: this `CLAUDE.md`, the affected app's `CLAUDE.md`/`README.md`, and `DRAFT.md` if it describes the affected area. Don't leave docs describing the old architecture.
