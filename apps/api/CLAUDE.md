# CLAUDE.md — apps/api

NestJS 12 backend. ESM (`"type": "module"`), TypeScript, Vitest for tests, Prisma 7 (PostgreSQL via `@prisma/adapter-pg`).

See `AGENTS.md` for NestJS Observe (production telemetry) setup and usage.

## Commands (from repo root, or drop `-w api` inside this dir)

- `npm run start:dev -w api` — watch mode (listens on `PORT`, default `3003`)
- `npm run build -w api` / `npm run start:prod -w api`
- `npm run lint -w api` — ESLint with `--fix`
- `npm test -w api` — unit tests (`vitest run`); `test:e2e` for e2e (`vitest.config.e2e.ts`); `test:cov` for coverage
- Root shortcuts: `npm run dev:api`, `npm run test:api`, `npm run test:e2e:api`
- Prisma (run inside `apps/api`): `npx prisma migrate dev` (create/apply a migration), `npx prisma generate` (regenerate the client into `src/generated/prisma`). Config is `prisma.config.ts`, which loads the repo-root `.env`.

## Structure

- `src/main.ts` — bootstrap: cookie parser, global `ValidationPipe({ whitelist: true })`, Swagger UI at `/api/docs` and the OpenAPI YAML at `/api/docs-yaml`; `src/app.module.ts` — root module (`ConfigModule` global, `DbModule`, `AuthModule`, `UserModule`, `StatisticsModule`, `FacilitiesModule`, `ProvidersModule`, `DeviceModule`)
- One folder per feature in `src/` (`auth`, `user`, `statistics`, `facilities`, `providers`, `device`), each with `*.module.ts`, `*.controller.ts`, `*.service.ts` and `dto.ts`. `src/app.controller.ts` is the starter `GET /` hello route
- `src/db/` — `DbModule` / `DbService`: a `PrismaClient` (pg adapter) built from `DATABASE_URL`; inject `DbService` to query
- `src/generated/prisma/` — generated Prisma client (don't edit); `prisma/schema.prisma` is the source of truth for the DB, `prisma/migrations/` holds the migrations
- `src/types/express.d.ts` — typing for `req.session`
- specs live beside sources as `*.spec.ts`; `test/` — e2e tests (`auth`, `statistics`, `facilities`, `providers`, `device`, `app`). They hit the real dev database and run sequentially (`fileParallelism: false`); each spec removes the rows it creates
- `docs/` — design notes; `docs/db-entities.md` holds the DB entities derived from the Figma file (planning notes, `prisma/schema.prisma` is what actually exists)

## Endpoints

All routes except `POST /auth/register` and `POST /auth/login` use `AuthGuard` (401 without a valid `access-token` cookie).

| Route                     | Description                                                                                                                                                                                 |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST /auth/register`     | Create a user, set the cookie, return `{ accessToken }` (201)                                                                                                                               |
| `POST /auth/login`        | Sign in; sets the httpOnly `access-token` cookie (200)                                                                                                                                      |
| `POST /auth/logout`       | Clears the cookie                                                                                                                                                                           |
| `GET /auth/session`       | Session info from the token (`GetSessionInfoDto`)                                                                                                                                           |
| `GET /user`               | Current user (`UserDto`)                                                                                                                                                                    |
| `GET /statistics`         | Counts of `patients`, `facilities`, `providers`, `devices` (`StatisticsDto`)                                                                                                                |
| `GET /facilities`         | List (`FacilityDto[]`); query `q` (name contains, case-insensitive) and `sortBy=name\|dateAdded`                                                                                            |
| `POST /facilities`        | Create (201); duplicate `ein` → 409 `{ type: 'ein-exists' }`                                                                                                                                |
| `PATCH /facilities/:id`   | Update name, address, city, state, zip, phone, unit, contact name/email (not `ein`/`permit`/`npi`)                                                                                          |
| `DELETE /facilities/:id`  | Delete, returns the deleted facility; also removes its providers (cascade); unknown id → 404                                                                                                |
| `GET /providers`          | List (`ProviderDto[]`); query `q` (first or last name contains, case-insensitive) and `sortBy=providerName\|facilityName`                                                                   |
| `GET /providers/:id`      | One provider (`ProviderDto`); unknown id → 404                                                                                                                                              |
| `GET /device`             | List (`DeviceDto[]`); query `q` (Device ID contains, case-insensitive) and `sortBy=model\|dateAdded` (default newest first)                                                                 |
| `POST /device`            | Create from a GS1 `deviceId` (`AddDeviceItemDto`, optional `facilityId`); 400 `invalid-device-id` / `unknown-device-model` / `facility-inactive`, 404 unknown facility, 409 `device-exists` |
| `PATCH /device/:id`       | Replace `deviceId` and facility (omitted `facilityId` clears it); same errors as create, unknown id → 404                                                                                   |
| `DELETE /device/:id`      | Delete, returns the deleted device (`DeviceDto`); unknown id → 404                                                                                                                          |
| `GET /device-model/:gtin` | One model by GTIN-14 (`DeviceModelDto`); bad GTIN → 400, unknown → 404                                                                                                                      |
| `POST /device-model`      | Create (`name`, optional `gtin`); duplicate name or GTIN → 409 `device-model-exists`                                                                                                        |
| `PATCH /device-model/:id` | Update name / GTIN; changing the GTIN of a model in use → 409 `device-model-in-use`; unknown id → 404                                                                                       |

`sortBy=name` is A-Z, `sortBy=dateAdded` (the default) is newest first.

## Auth

`AuthService` issues a JWT (`@nestjs/jwt`, expires in 1 day); `CookieService` stores it in the httpOnly `access-token` cookie (24 h). `AuthGuard` verifies the cookie and puts the payload on `req.session`; read it in controllers with the `@SessionInfo()` decorator. Passwords are salted and hashed with PBKDF2 (`PasswordService`).

Known issue: the signing secret is set in `AuthModule` (`JwtModule.register`). The `process.env.JWT_SECRET` line there is commented out and the secret is currently a path derived from `__dirname` (`…/.env`), not a real secret. `AuthGuard` passes `process.env.JWT_SECRET` to `verifyAsync`; when that variable isn't loaded, the module's secret is used. Before deploying, switch both places to one real `JWT_SECRET` (e.g. via `ConfigService`).

## Environment

`.env` files are not committed. `ConfigModule` loads the `.env` of the directory the API starts from (`apps/api/.env`, which holds `DATABASE_URL`); `prisma.config.ts` loads the repo-root `.env`, which also has the Postgres vars and `JWT_SECRET`. Variables: `DATABASE_URL` (PostgreSQL; local DB via `docker compose up -d db` from the repo root), optional `PORT` (default `3003`), `JWT_SECRET` (see the auth note above). `DbService` throws on startup without `DATABASE_URL`. The root `.env.example` currently lists only the Postgres vars and `FIGMA_FILE_KEY`, not `DATABASE_URL` or `JWT_SECRET`.

## OpenAPI and the web client

`apps/web` generates its API client from `/api/docs-yaml` (orval), so the Swagger decorators define what the frontend sees. After changing a controller or DTO, run the API, then `npm run api:download -w web && npm run api:generate -w web`.

Known gaps in the `facilities` schema (the web app works around them in `apps/web/src/shared/api/facilities.ts`; remove that file once these are fixed and the client is regenerated):

- `GET /facilities` is documented as returning a single `FacilityDto` (`@ApiResponse({ type: FacilityDto })` without `isArray: true`)
- the `sortBy` query param has no `@ApiProperty`, so it is missing from the schema
- `FacilityDto.unit` (`string | null`) is generated as an object type; it needs `@ApiProperty({ type: String, nullable: true, required: false })`

## Conventions

- One Nest module per feature with controller + service; register in `AppModule`.
- Annotate every controller response and DTO field with `@nestjs/swagger` decorators (arrays need `isArray: true`, enums need `enum`/`enumName`, nullable fields `nullable: true`), because the web client is generated from them.
- Use relative imports with explicit `.js` extensions where ESM requires them.
- Add a spec next to each new controller/service; e2e specs go in `test/`.

## Documentation

If a change alters this app's architecture (structure, modules/routes, data flow, integrations, key dependencies), update this file and `README.md` in the same change. If it affects the wider system, update the root `CLAUDE.md` too.
