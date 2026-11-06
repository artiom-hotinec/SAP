# CLAUDE.md — apps/web

Next.js 16 (App Router) + React 19 + Tailwind CSS 4.

**Read `AGENTS.md` first.** This Next.js version has breaking changes; consult `node_modules/next/dist/docs/` before writing code.

## Commands (from repo root, or drop `-w web` inside this dir)

- `npm run dev -w web` — dev server
- `npm run build -w web` / `npm run start -w web`
- `npm run lint -w web`
- `npm run api:download -w web` — fetch the OpenAPI schema from the running API (`http://localhost:3003/api/docs-yaml`) into `src/shared/api/schema.yaml`
- `npm run api:generate -w web` — regenerate `src/shared/api/generated.ts` (orval, plain typed request functions) from that schema

## Structure

- `src/app/` — Next routes, `layout.tsx`, `globals.css`, `providers/` (thin; route files only re-export from `src/views`). Routes: `/` (home), `/sign-in`, `/ui-kit` (public UI-kit demo)
- `src/proxy.ts` — Next 16 proxy (formerly middleware): optimistic auth redirects based on the `access-token` cookie (no cookie → `/sign-in`; cookie on `/sign-in` → `/`; `/ui-kit` is public)
- `src/` — also FSD layers: `views` (FSD pages layer), `widgets`, `features`, `entities`, `shared`. Alias `@/*` → `src/*`
- `public/` — static assets
- `next.config.ts` (also rewrites `/api/:path*` → `${API_URL}/:path*`), `eslint.config.mjs`, `tsconfig.json`

## API and auth

- `src/shared/api/` is the only place that talks to the backend. `generated.ts` is produced by orval (`orval.config.js`, default axios client, plain functions only, no React Query) from `schema.yaml`; never edit it by hand. Every request goes through `createInstance` in `api-instance.ts` (`baseURL: '/api'`).
- Import request functions, DTO types, `ErrorType` and `queryClient` from `@/shared/api` (its `index.ts` lists the public exports; add to it when another generated function is needed).
- React Query hooks are not generated; they are written by hand in `entities/*/api` on top of those functions. `entities/session` owns `sessionQueryKey`, `useSessionQuery`, `useSignInMutation` and `useSignOutMutation`; features add navigation and cache handling in their `onSuccess`.
- `API_URL` (backend origin, default `http://localhost:3003`) is read by `next.config.ts`. Next loads `.env` files from `apps/web/`, not the repo root.
- Forms use `react-hook-form` (`register` + per-field `validate` functions in the slice's `model/`); API errors come from the entity's React Query mutation.
- Sign-in flow: `features/auth/sign-in` (`SignInForm`, `useSignIn`) calls `useSignInMutation` from `entities/session`; the API sets the httpOnly cookie, the feature invalidates the session query and goes to `/`. `features/auth/sign-out` (`SignOutButton`) clears the React Query cache and goes to `/sign-in`.
- `views/sign-in` composes the Figma sign-in screen. "Forgot Password", "Terms of Use", "Privacy Policy" and "Contact Sales" are placeholder `href="#"` links (`UiLink`). There is no sign-up UI.
- Route paths and the cookie name live in `@/shared/config` (`ROUTES`, `AUTH_COOKIE_NAME`).

## Conventions

- **Architecture: Feature-Sliced Design (FSD).** Organize frontend code by FSD (https://feature-sliced.design):
  - Layers, top to bottom: `app` → `pages` → `widgets` → `features` → `entities` → `shared`. A module may import only from layers strictly below it, never sideways or upward.
  - Layers are split into slices (by business domain), and slices into segments (`ui`, `model`, `api`, `lib`, `config`). `shared` has segments only, no slices.
  - Each slice exposes a public API via its `index.ts`; import from it, never from a slice's internals.
  - Next.js clash: Next owns `src/app/` (routing) and treats `pages/` as the Pages Router. Keep route files in `src/app/` thin (they only re-export from the FSD `pages` layer), and put the FSD layers in `src/`, naming the FSD pages layer `src/views` (or `_pages`) so Next doesn't pick it up as routes.
- Prefer Server Components; add `'use client'` only when needed.
- Style with Tailwind utility classes.
- UIkit components (`src/shared/ui`): when creating a component via the UI, prefix the filename with `ui-` (e.g. `ui-button.tsx`).
- Don't edit the `nextjs-agent-rules` block in `AGENTS.md` (managed by `next dev`).

## Documentation

If a change alters this app's architecture (structure, modules/routes, data flow, integrations, key dependencies), update this file and `README.md` in the same change. If it affects the wider system, update the root `CLAUDE.md` too.
