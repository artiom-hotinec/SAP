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

- `src/app/` — Next routes, `layout.tsx`, `globals.css`, `providers/` (thin; route files only re-export from `src/views`). Routes: `/sign-in`, `/ui-kit` (public UI-kit demo), and the authenticated app shell in the `(main)` route group (`(main)/layout.tsx` renders `widgets/sidebar` next to `<main>`): `/` (dashboard), `/patients`, `/facilities`, `/providers`, `/providers/[id]` (provider details), `/devices`, `/settings`. Everything except the dashboard, facilities and providers is a placeholder (`UiPagePlaceholder`). `/sign-in` and `/ui-kit` sit outside `(main)`, so they have no sidebar
- `src/proxy.ts` — Next 16 proxy (formerly middleware): optimistic auth redirects based on the `access-token` cookie (no cookie → `/sign-in`; cookie on `/sign-in` → `/`; `/ui-kit` is public). Every other path, including the `(main)` routes, is protected
- `src/` — also FSD layers: `views` (FSD pages layer), `widgets`, `features`, `entities`, `shared`. Alias `@/*` → `src/*`
- `public/` — static assets
- `next.config.ts` (also rewrites `/api/:path*` → `${API_URL}/:path*`), `eslint.config.mjs`, `tsconfig.json`

## API and auth

- `src/shared/api/` is the only place that talks to the backend. `generated.ts` is produced by orval (`orval.config.js`, default axios client, plain functions only, no React Query) from `schema.yaml`; never edit it by hand. Every request goes through `createInstance` in `api-instance.ts` (`baseURL: '/api'`).
- Import request functions, DTO types, `ErrorType` and `queryClient` from `@/shared/api` (its `index.ts` lists the public exports; add to it when another generated function is needed).
- Providers use the generated client directly (`providersControllerGetProviders`, `providersControllerGetProvider`, `ProviderDto`, `ProviderSortBy`); the API's OpenAPI schema for them is correct.
- Temporary exception: `shared/api/facilities.ts` hand-writes `getFacilities` (returns `Facility[]`, accepts `q` and `sortBy`), `FacilitySortBy` and the `Facility` type (`unit: string | null`), because the API's OpenAPI schema describes `GET /facilities` as a single `FacilityDto`, omits `sortBy` and types `unit` as an object. Once the API schema is fixed, regenerate and replace it with `facilitiesControllerGetFacilities` / `FacilityDto`.
- React Query hooks are not generated; they are written by hand in `entities/*/api` on top of those functions. `entities/session` owns `sessionQueryKey`, `useSessionQuery`, `useSignInMutation` and `useSignOutMutation`; features add navigation and cache handling in their `onSuccess`. `entities/statistics` owns `useStatisticsQuery` (`GET /statistics`). `entities/user` owns `useUserQuery` (`GET /user`), the `UserCard` (initials circle, display name, role label from `UserDto.role`; no photo yet because `avatar` uploading doesn't exist) and the `getDisplayName`/`getInitials`/`getRoleLabel` helpers.
- `API_URL` (backend origin, default `http://localhost:3003`) is read by `next.config.ts`. Next loads `.env` files from `apps/web/`, not the repo root.
- Forms use `react-hook-form` (`register` + per-field `validate` functions in the slice's `model/`); API errors come from the entity's React Query mutation.
- Sign-in flow: `features/auth/sign-in` (`SignInForm`, `useSignIn`) calls `useSignInMutation` from `entities/session`; the API sets the httpOnly cookie, the feature invalidates the session query and goes to `/`. `features/auth/sign-out` (`SignOutButton`) clears the React Query cache and goes to `/sign-in`.
- `views/sign-in` composes the Figma sign-in screen. "Forgot Password", "Terms of Use", "Privacy Policy" and "Contact Sales" are placeholder `href="#"` links (`UiLink`). There is no sign-up UI.
- `widgets/sidebar` (`Sidebar`, server; `SidebarNav`, client, marks the active route with `aria-current="page"`) is the dark left nav: `UiLogo`, nav items from `config/nav-items.ts`, `UserCard` and `SignOutButton appearance="link"`. `features/auth/sign-out` also has a plain text-link appearance for it.
- `entities/facility` owns `facilitiesQueryKey`, `useFacilitiesQuery(params)` (`GET /facilities`, keeps previous data while search/sort change), `useCreateFacilityMutation` (`POST /facilities`), `useUpdateFacilityMutation` (`PATCH /facilities/:id`, variables `{ id, data }`), `useDeleteFacilityMutation`, `formatLocation`, `FACILITY_ROW_GRID` (column layout shared by rows and the list header), `FacilityRow` (collapsible row; `expanded`/`onToggle`/`details` props) and `FacilityDetails` (read-only info grid with an `actions` slot). `features/facility/delete` (`DeleteFacilityButton`, `useDeleteFacility`) asks "Delete <name>?" in a `UiModal` (`shared/ui/ui-modal.tsx`, native `<dialog>`; `confirm` variant = Cancel + Yes, `single` variant = one Close button, from the Figma modal nodes 117-13325 / 117-12194), deletes on Yes, then invalidates the facilities and statistics queries.
- `features/facility/upsert` (`CreateFacilityButton`, `EditFacilityButton`) opens `FacilityFormDrawer`, a 3-step form in a `UiDrawer` (`shared/ui/ui-drawer.tsx`: right-side 520px native `<dialog>`, `stepper`/`footer` slots, Escape and backdrop click call `onClose`; backdrop uses the `bg-backdrop` theme token, Figma nodes 700-11370 / 4979-12452 / 700-12246 / 1739-12291). Create runs step 1 EIN, permit, NPI → step 2 name, address, unit, zip, city, State (`UiDropdown` with `US_STATES` from `@/shared/config`) → step 3 contact person, phone, email. **Edit starts at step 2** (no Back there) because `UpdateFacilityItemDto` can't change `ein`/`permit`/`npi`. `model/use-facility-form.ts` holds the react-hook-form state and step state (Next validates only that step's `STEP_FIELDS`; Enter on steps 1-2 acts as Next); `model/use-upsert-facility.ts` calls the entity mutations and invalidates the facilities query (plus statistics on create). A 409 `{ type: 'ein-exists' }` sends the user back to step 1 with an EIN error; other failures show a generic alert. The buttons mount the drawer only while open, so each open starts from fresh values. `toUpdateDto` sends `unit: ''` when cleared (an omitted field would keep the old value). The form validates on change (`mode: 'onChange'`), so an error set by Next clears as soon as the field is valid. `UiDropdown` takes an `error` prop; its open list scrolls (`max-h-60`), opens upward when there isn't room below, and Escape closes only the list (not an enclosing drawer).
- `views/facilities` (`FacilitiesList`, client) composes the Figma list: count title, debounced name search (`UiSearch`), `CreateFacilityButton` ("+"), "Sort by" `UiDropdown` (`config/sort-options.ts`), one expanded row at a time with `EditFacilityButton` and `DeleteFacilityButton` in the row's `actions`, skeleton/error/empty states.
- `entities/provider` owns `providersQueryKey`, `useProvidersQuery(params)` (`GET /providers`, `q` + `sortBy`, keeps previous data while search/sort change), `useProviderQuery(id)` (`GET /providers/:id`, no retry on 404), `PROVIDER_ROW_GRID` (column layout shared by rows and the list header), `ProviderRow` (the whole row is a `next/link` to `providerDetailsRoute(id)`, so the email is plain text) and `ProviderDetails` (the "Provider Information" card: avatar + read-only fields). There are no provider photos (the API has no photo field), so avatars are initials via `UiAvatar` (`shared/ui/ui-avatar.tsx`, `sm` 32px / `lg` 74px with a blue ring).
- `views/providers` (`ProvidersList`, client) composes the Figma list: count title, debounced name search, "Sort by" `UiDropdown` (`config/sort-options.ts`: provider name / facility name, from the generated `ProviderSortBy`), column header and `ProviderRow` links, skeleton/error/empty states. No create/edit/delete. `views/provider-details` (`ProviderDetailsPage`, client, takes `id`) shows the "Back to all providers" link and `ProviderDetails`, with skeleton, "Provider not found." (404) and error states; the route is `src/app/(main)/providers/[id]/page.tsx` (awaits the `params` Promise).
- `shared/lib` holds generic helpers: `formatDate` ("August 2, 2021"), `getInitials` (initials from first/last name with a fallback; `entities/user`'s `getInitials` delegates to it) and `useDebouncedValue`.
- `views/dashboard` shows the four statistics cards (`StatisticsCards` → `UiStatCard`, order and icons in `config/stat-cards.ts`) with skeleton and error states. The Figma search input on this screen is intentionally not built.
- Route paths and the cookie name live in `@/shared/config` (`ROUTES`: `dashboard`, `patients`, `facilities`, `providers`, `devices`, `settings`, `signIn`, `uiKit`; `providerDetailsRoute(id)` → `/providers/<id>`; `AUTH_COOKIE_NAME`).

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
