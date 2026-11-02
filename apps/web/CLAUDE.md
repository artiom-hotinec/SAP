# CLAUDE.md — apps/web

Next.js 16 (App Router) + React 19 + Tailwind CSS 4.

**Read `AGENTS.md` first.** This Next.js version has breaking changes; consult `node_modules/next/dist/docs/` before writing code.

## Commands (from repo root, or drop `-w web` inside this dir)

- `npm run dev -w web` — dev server
- `npm run build -w web` / `npm run start -w web`
- `npm run lint -w web`

## Structure

- `app/` — routes, `layout.tsx`, `page.tsx`, `globals.css`
- `public/` — static assets
- `next.config.ts`, `eslint.config.mjs`, `tsconfig.json`

## Conventions

- Prefer Server Components; add `'use client'` only when needed.
- Style with Tailwind utility classes.
- Don't edit the `nextjs-agent-rules` block in `AGENTS.md` (managed by `next dev`).

## Documentation

If a change alters this app's architecture (structure, modules/routes, data flow, integrations, key dependencies), update this file and `README.md` in the same change. If it affects the wider system, update the root `CLAUDE.md` too.
