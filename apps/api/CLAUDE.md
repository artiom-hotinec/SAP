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

- `src/main.ts` — bootstrap: cookie parser, global `ValidationPipe({ whitelist: true })`, Swagger UI at `/api/docs` and the OpenAPI YAML at `/api/docs-yaml`; `src/app.module.ts` — root module (`ConfigModule` global, `DbModule`, `AuthModule`, `UserModule`, `StatisticsModule`, `FacilitiesModule`, `ProvidersModule`, `PasswordModule`, `DeviceModule`, `PatientModule`, `StorageModule`, `PatientMessageModule`, `PatientDocumentModule`, `PatientNoteModule`)
- One folder per feature in `src/` (`auth`, `user`, `statistics`, `facilities`, `providers`, `device`, `patient`, `patient-document`, `patient-note`, `patient-message`), each with `*.module.ts`, `*.controller.ts`, `*.service.ts` and `dto.ts`. `src/app.controller.ts` is the starter `GET /` hello route
- `src/db/` — `DbModule` / `DbService`: a `PrismaClient` (pg adapter) built from `DATABASE_URL`; inject `DbService` to query
- `src/generated/prisma/` — generated Prisma client (don't edit); `prisma/schema.prisma` is the source of truth for the DB, `prisma/migrations/` holds the migrations
- `src/patient/` — the patient routes; unlike the other features its DTOs are one class per file in `dto/` and the pure helpers live in `lib/` (`to-patient-dto.ts`: `patientInclude` + `toPatientDto`, `activity-filter.ts`, `clinical-info.ts`, `avatar.ts`). `patient-document/`, `patient-note/` and `patient-message/` are the `/patients/:patientId/...` sub-resources
- `src/storage/` — `StorageModule` / `StorageService`: files on local disk under `UPLOADS_DIR` (`put` / `get` / `delete` by key); `src/common/` — shared helpers (`filename.helper.ts`, `date.helper.ts`)
- `src/types/express.d.ts` — typing for `req.session`
- specs live beside sources as `*.spec.ts`; `test/` — e2e tests (`auth`, `statistics`, `facilities`, `providers`, `device`, `patient`, `patient-document`, `patient-note`, `patient-message`, `app`). They hit the real dev database and run sequentially (`fileParallelism: false`); each spec removes the rows it creates
- `docs/` — design notes; `docs/db-entities.md` holds the DB entities derived from the Figma file (planning notes, `prisma/schema.prisma` is what actually exists)

## Endpoints

All routes except `POST /auth/register` and `POST /auth/login` use `AuthGuard` (401 without a valid `access-token` cookie).

| Route                                                 | Description                                                                                                                                                                                                                                                                  |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST /auth/register`                                 | Create a user, set the cookie, return `{ accessToken }` (201)                                                                                                                                                                                                                |
| `POST /auth/login`                                    | Sign in; sets the httpOnly `access-token` cookie (200)                                                                                                                                                                                                                       |
| `POST /auth/logout`                                   | Clears the cookie                                                                                                                                                                                                                                                            |
| `GET /auth/session`                                   | Session info from the token (`GetSessionInfoDto`)                                                                                                                                                                                                                            |
| `GET /user`                                           | Current user (`UserDto`)                                                                                                                                                                                                                                                     |
| `GET /statistics`                                     | Counts of `patients`, `facilities`, `providers`, `devices` (`StatisticsDto`)                                                                                                                                                                                                 |
| `GET /facilities`                                     | List (`FacilityDto[]`); query `q` (name contains, case-insensitive) and `sortBy=name\|dateAdded`                                                                                                                                                                             |
| `POST /facilities`                                    | Create (201); the contact person becomes the facility admin (see "Facility admin"); 409 `ein-exists` / `email-exists` (a user with `contactEmail` exists)                                                                                                                    |
| `PATCH /facilities/:id`                               | Update name, address, city, state, zip, phone, unit, contact name/email (not `ein`/`permit`/`npi`)                                                                                                                                                                           |
| `DELETE /facilities/:id`                              | Delete, returns the deleted facility; also removes its providers (cascade); unknown id → 404                                                                                                                                                                                 |
| `GET /providers`                                      | List (`ProviderDto[]`); query `q` (first or last name contains, case-insensitive) and `sortBy=providerName\|facilityName`                                                                                                                                                    |
| `GET /providers/:id`                                  | One provider (`ProviderDto`); unknown id → 404                                                                                                                                                                                                                               |
| `GET /device`                                         | List (`DeviceDto[]`, `assigned` = has a patient); query `q` (Device ID contains, case-insensitive) and `sortBy=model\|dateAdded` (default newest first)                                                                                                                      |
| `POST /device`                                        | Create from a GS1 `deviceId` (`AddDeviceItemDto`, optional `facilityId`); 400 `invalid-device-id` / `unknown-device-model` / `facility-inactive`, 404 unknown facility, 409 `device-exists`                                                                                  |
| `PATCH /device/:id`                                   | Replace `deviceId` and facility (omitted `facilityId` clears it); same errors as create, unknown id → 404                                                                                                                                                                    |
| `DELETE /device/:id`                                  | Delete, returns the deleted device (`DeviceDto`); unknown id → 404                                                                                                                                                                                                           |
| `GET /device-model/:gtin`                             | One model by GTIN-14 (`DeviceModelDto`); bad GTIN → 400, unknown → 404                                                                                                                                                                                                       |
| `POST /device-model`                                  | Create (`name`, optional `gtin`); duplicate name or GTIN → 409 `device-model-exists`                                                                                                                                                                                         |
| `PATCH /device-model/:id`                             | Update name / GTIN; changing the GTIN of a model in use → 409 `device-model-in-use`; unknown id → 404                                                                                                                                                                        |
| `GET /patients`                                       | List (`PatientDto[]`) of the caller's facility; query `q` (first/last/full name, case-insensitive), `sortBy=lastName\|dateAdded` (default newest first) and a single `filterBy=allPatients\|activePatients\|inActivePatients\|myPatients`; 403 if the user is not a provider |
| `GET /patients/:id`                                   | One patient (`PatientDto`); unknown id or another facility's patient → 404                                                                                                                                                                                                   |
| `POST /patients`                                      | Create the patient, its clinical info and optionally assign a device (`CreatePatientDto`, 201); 404 `provider-not-found` / `device-not-found`, 409 `device-unavailable` / `email-exists`                                                                                     |
| `PATCH /patients/:id`                                 | Partial update (`UpdatePatientDto`: fields, `providerId`, `clinicalInfo`, `device` omitted/`null`/new); same errors as create, unknown id → 404                                                                                                                              |
| `DELETE /patients/:id`                                | Delete, returns the deleted patient; cascades its data, frees its device, removes its files; unknown id → 404                                                                                                                                                                |
| `PUT /patients/:id/photo`                             | Upload a photo (multipart `file`, JPG/PNG/TIFF, max 5 MB), returns `PatientDto`; 400 `invalid-photo`, 413 over 5 MB, unknown id → 404                                                                                                                                        |
| `GET /patients/:id/photo`                             | The photo as `image/jpeg` (inline); no photo or unknown id → 404                                                                                                                                                                                                             |
| `DELETE /patients/:id/photo`                          | Remove the photo, returns `PatientDto`; no photo or unknown id → 404                                                                                                                                                                                                         |
| `GET /patients/:patientId/documents`                  | The patient's documents (`PatientDocumentDto[]`), newest first; unknown patient → 404                                                                                                                                                                                        |
| `POST /patients/:patientId/documents`                 | Upload a PDF/PNG/JPEG (multipart `file`, max 20 MB) (201); bad type or size → 400                                                                                                                                                                                            |
| `GET /patients/:patientId/documents/:documentId/file` | Download as an attachment; wrong patient or unknown document → 404                                                                                                                                                                                                           |
| `DELETE /patients/:patientId/documents/:documentId`   | Delete the row and the file (204)                                                                                                                                                                                                                                            |
| `GET /patients/:patientId/notes`                      | The patient's notes (`PatientNoteDto[]`); unknown patient → 404                                                                                                                                                                                                              |
| `POST /patients/:patientId/notes`                     | Add a note authored by the signed-in user (201)                                                                                                                                                                                                                              |
| `GET /patients/:patientId/messages`                   | The patient's messages (`PatientMessageDto[]`); unknown patient → 404                                                                                                                                                                                                        |
| `POST /patients/:patientId/messages`                  | Send a message as the signed-in provider (`body` up to 2000 chars)                                                                                                                                                                                                           |

`sortBy=name` is A-Z, `sortBy=dateAdded` (the default) is newest first.

## Facility admin

The facility's contact person is its admin (Figma: "Contact person (Admin)"). `POST /facilities` takes no extra admin fields. It creates three rows in one nested Prisma write (a single transaction, no `$transaction` call): the `Facility`, a `Provider` for it (the facility's `phone` and `address`; `npi` and `dateHired` are null, which is why both are nullable on `Provider` and `ProviderDto`), and that provider's `User` with role `PORTAL_ADMIN` (`email` = `contactEmail`, `phone`, and `contactName` split into `firstName` + `lastName`; a one-word name has no last name). The role is always set by the server. If any insert fails, nothing is saved. The admin gets a random throwaway password plus a `resetToken` that expires in 7 days. Nothing uses `resetToken` yet, so there's no set-password / invite flow and the admin can't sign in. Admins are `Provider` rows, so `GET /providers` lists them too. Known gaps: `PATCH /facilities/:id` doesn't update the admin's email or name, and deleting a facility removes the admin's `Provider` (cascade) but leaves the `User`.

Duplicate errors: with the pg driver adapter, Prisma's P2002 has no `meta.target`. The table is on `meta.driverAdapterError.cause.table`. `User` maps to `email-exists`, and anything else to `ein-exists`.

## Patients

`PatientService` (`src/patient/patient.service.ts`) holds all the rules; the controller only passes `session.id` and the params.

- **Scope.** The caller must be a provider (`getCaller` looks up their `Provider` row, else 403). Every `/patients` route is limited to the caller's facility, and a patient of another facility is a 404, never a 403. `findAccessible(me, patientId, args)` is the one place that loads "a patient the caller may access"; use it for any new patient route. The facility always comes from the caller (a `facilityId` in a body is dropped by `whitelist`); `providerId` defaults to the caller and must belong to the same facility (`provider-not-found`).
- **Response.** `toPatientDto` needs `patientInclude` (provider + user, newest session). `lastAppointment` is the newest `TherapySession.endedAt`, `registered` is `userId !== null`. `activePatients` means a session in the last `ACTIVE_WINDOW_DAYS` (30, a placeholder in `lib/activity-filter.ts`); both active and inactive together cancel out.
- **Clinical info.** `lib/clinical-info.ts` builds the `PatientClinicalInfo` payload for create and update. A partial update never clears a field it did not send; turning `maskFitting` / `sleepStudy` off clears its date. The one `prescribedPressure` of a device is stored as both `prescribedPressureMin` and `prescribedPressureMax`.
- **Devices.** Create and update run in a transaction and claim the device with a conditional `updateMany` (`patientId: null`, facility null or the caller's), so two requests cannot take the same device; a count of 0 is 409 `device-unavailable` and rolls the whole write back. On update `device: null` unassigns, a new `deviceId` swaps (the old one is freed), the same `deviceId` only updates the pressure.
- **Delete.** The database cascades clinical info, notes, documents, messages and sessions, sets `Device.patientId` and `Patient.userId` to null (the device is kept, the user account stays). Files are removed after the row, best effort.
- **Photos.** `lib/avatar.ts` (sharp) checks the real format, rotates, resizes to 512x512, re-encodes as JPEG (no EXIF) and stores it at `patients/<id>/avatar/<uuid>.jpg`; `Patient.avatar` holds that key and is never sent to the client. A replaced or deleted photo's file is removed after the row is updated.

Known gaps:

- `patient-document`, `patient-note` and `patient-message` only check that the patient exists (`assertPatientExists`), not the caller's facility, so a provider can use them on another facility's patients by id. Use `findAccessible` (or share it from `PatientModule`) to close this.
- `PatientQueryDto.filterBy` is typed as an array but validated as a single enum with no transform, so only one `filterBy` value works (a repeated parameter is a 400). `sortBy=unreadMessages` is accepted but falls back to newest first: there is no read flag on `ProviderMessage`.
- `PatientDto` has no `hasPhoto`, so the web app cannot tell whether to request `GET /patients/:id/photo`.
- Deleting a patient is a hard delete, and the linked mobile `User` is left behind.

## Auth

`AuthService` issues a JWT (`@nestjs/jwt`, expires in 1 day); `CookieService` stores it in the httpOnly `access-token` cookie (24 h). `AuthGuard` verifies the cookie and puts the payload on `req.session`; read it in controllers with the `@SessionInfo()` decorator. Passwords are salted and hashed with PBKDF2 (`PasswordService`).

Known issue: the signing secret is set in `AuthModule` (`JwtModule.register`). The `process.env.JWT_SECRET` line there is commented out and the secret is currently a path derived from `__dirname` (`…/.env`), not a real secret. `AuthGuard` passes `process.env.JWT_SECRET` to `verifyAsync`; when that variable isn't loaded, the module's secret is used. Before deploying, switch both places to one real `JWT_SECRET` (e.g. via `ConfigService`).

## Environment

`.env` files are not committed. `ConfigModule` loads the `.env` of the directory the API starts from (`apps/api/.env`, which holds `DATABASE_URL`); `prisma.config.ts` loads the repo-root `.env`, which also has the Postgres vars and `JWT_SECRET`. Variables: `DATABASE_URL` (PostgreSQL; local DB via `docker compose up -d db` from the repo root), optional `PORT` (default `3003`), `JWT_SECRET` (see the auth note above), optional `UPLOADS_DIR` (where `StorageService` keeps uploaded files, default `uploads` relative to the working directory; it is read when the service is created). `DbService` throws on startup without `DATABASE_URL`. The root `.env.example` currently lists only the Postgres vars and `FIGMA_FILE_KEY`, not `DATABASE_URL` or `JWT_SECRET`.

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
