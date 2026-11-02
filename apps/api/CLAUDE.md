# CLAUDE.md — apps/api

NestJS 12 backend. ESM (`"type": "module"`), TypeScript, Vitest for tests.

See `AGENTS.md` for NestJS Observe (production telemetry) setup and usage.

## Commands (from repo root, or drop `-w api` inside this dir)

- `npm run start:dev -w api` — watch mode
- `npm run build -w api` / `npm run start:prod -w api`
- `npm run lint -w api` — ESLint with `--fix`
- `npm test -w api` — unit tests (`vitest run`); `test:e2e` for e2e (`vitest.config.e2e.ts`); `test:cov` for coverage

## Structure

- `src/main.ts` — bootstrap; `src/app.module.ts` — root module
- `src/*.controller.ts`, `*.service.ts` — feature code; specs live beside sources as `*.spec.ts`
- `test/` — e2e tests

## Conventions

- One Nest module per feature with controller + service; register in `AppModule`.
- Use relative imports with explicit `.js` extensions where ESM requires them.
- Add a spec next to each new controller/service.

## Documentation

If a change alters this app's architecture (structure, modules/routes, data flow, integrations, key dependencies), update this file and `README.md` in the same change. If it affects the wider system, update the root `CLAUDE.md` too.
