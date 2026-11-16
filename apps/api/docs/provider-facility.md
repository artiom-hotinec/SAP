# Provider ↔ Facility

How a provider is attached to a facility. Sources: `db-entities.md` (Figma-derived) and `prisma/schema.prisma`.

## Relationship

`Facility 1 — N Provider`. The link is `Provider.facilityId` (required, indexed, `onDelete: Cascade`). Deleting a facility deletes its providers (`DELETE /facilities/:id`).

```prisma
model Provider {
  userId     String   @unique   // 1:1 with User (login)
  facilityId String
  facility   Facility @relation(fields: [facilityId], references: [id], onDelete: Cascade)
}
```

`Patient` and `Device` also carry `facilityId`. Nothing in the schema forces a patient's facility to equal their provider's facility; enforce that in the service layer.

## Who is who

| Thing        | What it is                                                         | Table                                                |
| ------------ | ------------------------------------------------------------------ | ---------------------------------------------------- |
| Facility     | The clinic (name, address, EIN, permit, NPI, contact name / email) | `Facility`                                           |
| Portal admin | A person who logs in and manages one facility                      | `User` with `role = PORTAL_ADMIN`                    |
| Provider     | A clinician at that facility                                       | `User` with `role = PROVIDER`, plus a `Provider` row |
| Super admin  | Manages all facilities                                             | `User` with `role = SUPER_ADMIN`                     |

A facility is an organization record, not a user. `contactName` and `contactEmail` on `Facility` are plain text, not a link to a user.

## Current state

Provider creation is not implemented. `src/providers/` has an empty `ProvidersController` and a `ProviderDto` with only `id`. `POST /auth/register` creates a `User` only, so no `Provider` row (and no `facilityId`) is ever written.

## Proposed: how a provider learns its facility

`facilityId` is required, so the caller must supply it. Proposed endpoint (not built yet):

```
POST /facilities/:facilityId/providers
body: { email, password, firstName, lastName, npi, phone, address, dateHired }
```

The service:

1. Looks up the facility; unknown id → 404.
2. In one `$transaction`, creates the `User` (`role = PROVIDER`) and then the `Provider` with `facilityId` from the URL.

This matches the Figma flow: open a facility, then add a provider to it.

Alternative: `POST /providers` with `facilityId` in the body (validated as a UUID). Same logic.

## Who may create a provider

- **Super admin**: passes the facility in the URL.
- **Portal admin**: the facility must come from the admin's own account, not the request, so they can only add providers to their own facility.

## Gap: portal admin → facility is not modelled

- `User` has no `facilityId`.
- A portal admin has no `Provider` row, so nothing ties them to a facility.
- `db-entities.md` suggests reusing `Provider` for admins, but that table requires `npi`, `dateHired` and `address`, which may not fit an admin.

Options: add an optional `User.facilityId` set only for `PORTAL_ADMIN`, or start with super-admin-only creation. See also "Option: create the first portal admin with the facility" below.

## Option: create the first portal admin with the facility

Not decided. Instead of a separate admin endpoint, `POST /facilities` (the "add facility" form) also creates the first portal admin. This makes sense only if there is one admin per facility (not confirmed in Figma).

**Model: `User` with `role = PORTAL_ADMIN`, not `Provider`.**

- `Provider` is for clinicians and requires `npi` (unique), `phone`, `address`, `dateHired`; the form only has `contactName` and `contactEmail`.
- A `Provider` row would make the admin appear in provider lists and in `GET /statistics` (`providers`), and the admin could be chosen as a patient's provider (`Patient` and `ProviderMessage` point at `Provider`).

**Flow**, in one `$transaction`:

1. Create the `Facility`.
2. Create a `User` with `role = PORTAL_ADMIN`:
   - `email` from `contactEmail`
   - `firstName` / `lastName` from `contactName` (one string today: split it, or add two form fields)
   - no password; set `resetToken` and email an invite link
3. Link the user to the facility.

A duplicate email returns 409, like the existing `ein-exists` case.

**Schema change:** add an optional `User.facilityId`, set only for `PORTAL_ADMIN`, with `Facility.users User[]` on the other side.

**Trade-off:** `contactEmail` would be both the facility contact address and the admin's login email, so it can't change independently of the login. To keep them separate, add explicit `adminEmail` and `adminName` fields to the form instead of reusing the contact ones.

## Open questions

1. Super-admin-only creation first, or support portal admins too (needs `User.facilityId`)?
2. There is no role guard yet; one is needed before restricting this endpoint.
