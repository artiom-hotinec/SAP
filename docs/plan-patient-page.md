# Plan: Patient Page and Create/Edit Patient Modal

**PRD:** docs/prd-patient-page.md
**Date:** 2026-11-26

## Notes

- `apps/web` has no test runner, and the PRD puts automated UI tests out of scope and specifies manual browser verification. Each phase therefore has a "Tests" line made of a manual Playwright MCP check (signed in as `test@gmail.com` / `1234`, no new users) plus `npm run lint` and `npm run build`. If you want unit tests for validation/mapping helpers, add Vitest to `apps/web` (not in the PRD).
- The generated client (`shared/api/generated.ts`) has no patient endpoints yet, so Phase 1 starts by regenerating it.
- Known backend gaps from `apps/api/CLAUDE.md` that affect the UI (backend changes are out of scope, so work around them and report):
  - `filterBy` accepts one value only: use a single-select filter.
  - `sortBy=unreadMessages` falls back to newest first: don't offer it.
  - `PatientDto` has no `hasPhoto`: the avatar falls back to initials if `GET /patients/:id/photo` returns 404.
  - The documents, notes and messages routes aren't facility-scoped: no UI impact.
- Figma node IDs are in the PRD. Before each UI phase, fetch the relevant nodes with the Figma MCP and match them (the PRD hasn't been checked against the frames yet).
- Each phase also updates `apps/web/CLAUDE.md` (and the root `CLAUDE.md` if routes change) for what it adds.

## Implementation Phases

### Phase 1: Patients list (tracer bullet)

**Goal:** `/patients` shows real patients from the API, and clicking a row opens a minimal patient page route, so the whole path (API client → entity → view → route) works.
**Impacts:** Frontend
**Tasks:**

- [x] Regenerate the API client (`api:download`, `api:generate`), export the patient functions and types from `@/shared/api`, and add the `ROUTES` entry and `patientDetailsRoute(id)`.
- [x] `entities/patient`: query keys, `usePatientsQuery(params)` (`q`, `sortBy`, `filterBy`; keeps previous data) and `usePatientQuery(id)` (no retry on 404), plus `PatientRow` (a link to the details route) and the shared row grid.
- [x] `views/patients`: replace the placeholder with the Figma list (count title, debounced search, sort and filter dropdowns, header, rows, skeleton/error/empty states).
- [x] Add the route `/patients/[id]` and a `views/patient-details` stub that loads the patient and shows a name header with "Patient not found." (404) and error states.
- [x] Update `apps/web/CLAUDE.md` for the new slices and routes.

**Definition of Done:** `/patients` lists the signed-in provider's patients; search, sort and filter change the results and work together; clicking a row opens `/patients/<id>` showing the patient's name; an unknown id shows the not-found state.
**Tests:** Manual browser check of list, search + sort + filter combinations, empty (search with no match), error (API stopped), and 404 id; `npm run lint` and `npm run build` pass.

### Phase 2: Create patient modal

**Goal:** A provider can create a patient through the 5-step modal and see it in the list.
**Impacts:** Frontend
**Tasks:**

- [x] `entities/patient`: `useCreatePatientMutation` and the form field components/validators (email, ZIP, state, height 12–108 in as feet+inches sent as inches, weight 1–1500 lb).
- [x] `features/patient/upsert`: `PatientFormModal` shell with the stepper, Back/Next and per-step validation that keeps entered data when going back; steps 1–2 (personal info, address).
- [x] Steps 3–4: provider (defaults to the signed-in provider) and clinical info, then sleep study (dates shown only when the flag is on).
- [x] Step 5: optional device (only unassigned devices, from `GET /device`) with the prescribed pressure, submit, server error mapping (`email-exists`, `provider-not-found`, `device-not-found`, `device-unavailable`, other → generic alert), and invalidating the patients and statistics queries.
- [ ] Add `CreatePatientButton` to `views/patients` ("Add patient") and update `CLAUDE.md`.

**Definition of Done:** A valid form creates the patient and it appears in the list without a reload; invalid fields show inline errors per step and block Next; server errors show on the matching field or step; skipping the device creates a patient without one.
**Tests:** Manual browser check of the full create flow (with and without a device), each validation rule, Back/Next data retention, a duplicate email (409), then delete the created rows; `npm run lint` and `npm run build` pass.

### Phase 3: Patient page details

**Goal:** The patient page shows the full profile and the assigned device (no KAM Stats).
**Impacts:** Frontend
**Tasks:**

- [x] `entities/patient`: the profile header (photo or initials, name, key info) and read-only profile and clinical info sections from the Figma nodes.
- [x] Assigned device section (`--` when none), using what `PatientDto` provides.
- [ ] Page layout in `views/patient-details` with a "Back to all patients" link, loading and error states, and the skeleton.
- [ ] Update `CLAUDE.md`.

**Definition of Done:** `/patients/<id>` shows profile, clinical info, device and photo (initials fallback) matching Figma, with no KAM Stats section.
**Tests:** Manual browser check against the Figma nodes for a patient with and without a device and with empty optional fields; `npm run lint` and `npm run build` pass.

### Phase 4: Edit and delete patient

**Goal:** A provider can edit a patient from the patient page and delete a patient.
**Impacts:** Frontend
**Tasks:**

- [ ] `useUpdatePatientMutation` (variables `{ id, data }`) and `useDeletePatientMutation` in `entities/patient`.
- [ ] `EditPatientButton`: reuse `PatientFormModal` prefilled from the patient (partial `PATCH`, device omitted/`null`/new handled), starting at step 1, with the same error mapping; invalidate the patient and list queries.
- [ ] `features/patient/delete`: confirmation `UiModal`, delete, invalidate the list and statistics, and return to `/patients`.
- [ ] Wire both into the patient page header and update `CLAUDE.md`.

**Definition of Done:** Editing saves and updates both the patient page and the list; deleting asks for confirmation and removes the patient from the list; edit validation errors and server errors behave as in create.
**Tests:** Manual browser check of editing each step (including device swap and unassign) and deleting; `npm run lint` and `npm run build` pass.

### Phase 5: Photo

**Goal:** A provider can upload, replace and delete the patient's photo.
**Impacts:** Frontend
**Tasks:**

- [ ] `entities/patient`: photo upload and delete mutations (multipart `PUT`, `DELETE`) and the photo URL helper with a cache-busting key.
- [ ] `features/patient/photo`: upload/replace/remove control on the avatar with client checks for type (JPG/PNG/TIFF) and size (5 MB) and server error display (`invalid-photo`, 413).
- [ ] Show the photo in the list rows and the patient header (initials fallback), invalidating the queries after a change; update `CLAUDE.md`.

**Definition of Done:** Uploading, replacing and removing a photo updates the avatar on the patient page and in the list.
**Tests:** Manual browser check with valid and invalid files (wrong type, over 5 MB); `npm run lint` and `npm run build` pass.

### Phase 6: Messages

**Goal:** A provider can read and send messages to the patient.
**Impacts:** Frontend
**Tasks:**

- [ ] `entities/patient-message`: query and `useSendMessageMutation` (body up to 2000 chars).
- [ ] `features/patient/send-message`: composer with validation (non-empty, length) and error display.
- [ ] Messages section on the patient page from Figma (thread, empty/loading/error states) and `CLAUDE.md` update.

**Definition of Done:** The thread loads for the patient; a sent message appears without a reload.
**Tests:** Manual browser check of sending, empty and over-length input, and the empty thread; `npm run lint` and `npm run build` pass.

### Phase 7: Documents

**Goal:** A provider can manage the patient's documents.
**Impacts:** Frontend
**Tasks:**

- [ ] `entities/patient-document`: list query, upload and delete mutations, and the download link (`GET .../file`).
- [ ] `features/patient/upload-document` (PDF/PNG/JPEG, max 20 MB, client checks and error display) and `features/patient/delete-document` (with confirmation).
- [ ] Documents section on the patient page from Figma (list, empty/loading/error states) and `CLAUDE.md` update.

**Definition of Done:** Documents are listed, uploaded, opened/downloaded and deleted, each reflected without a reload.
**Tests:** Manual browser check with a valid PDF, a wrong type and an over-size file, then download and delete; `npm run lint` and `npm run build` pass.

### Phase 8: Notes and final verification

**Goal:** A provider can add notes, and the whole feature is checked against the PRD.
**Impacts:** Frontend
**Tasks:**

- [ ] `entities/patient-note`: list query and `useAddNoteMutation`.
- [ ] `features/patient/add-note` and the Notes section on the patient page from Figma (list, empty/loading/error states).
- [ ] Side-by-side check of every listed Figma node in the browser and fix the differences; review the FSD layer imports and public APIs (`index.ts`) of all new slices.
- [ ] Final docs pass (`apps/web/CLAUDE.md`, root `CLAUDE.md` routes, `DRAFT.md` if relevant) and a full manual run of every PRD flow, checking the console for errors.

**Definition of Done:** All PRD acceptance criteria are checked; a note appears without a reload; docs describe the final structure.
**Tests:** Full manual regression as `test@gmail.com` (create, edit, photo, message, note, document, delete) with no console errors; `npm run lint` and `npm run build` pass.
