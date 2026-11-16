# DB Entities (derived from Figma)

Source: Figma file `6tSE2kW8vaDnUWxYv5fAeY` (Kälm / KAM — CPAP therapy system).

Pages read: Mobile App, Provider Portal, Provider Portal Admin, Super Admin (screen names plus text on ~20 key screens: profile, device, settings, stats, patient detail, provider/facility/device lists).
Second pass also read: notification center, onboarding/join, Bluetooth device setup, Notify Healthcare Provider, Discover/Article, profile preferences, run/alarm screens, add-facility, Add Kam model, edit device, and the admin settings screens (fields from this pass are marked "(pass 2)").
Not read: Styleguide, CC, iOS Android App, Deprecated pages.

The product has a patient mobile app and web portals for three roles: provider, portal admin and super admin.

## Org and users

| Entity                 | Fields (from screens)                                                                                                                                                             |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Facility`             | name, city, state, phone, createdAt; (pass 2) address, unit/suite, zip, active (the "1 inactive" badge)                                                                           |
| `User` (auth base)     | email, passwordHash, role (`PATIENT` / `PROVIDER` / `PORTAL_ADMIN` / `SUPER_ADMIN`), firstName, lastName, avatar, resetToken; (pass 2) phone, unitsPreference (imperial / metric) |
| `UserConsent` (pass 2) | userId, shareWithProvider (required), termsAccepted (required), marketingOptIn (optional), acceptedAt. From the Join screens; password minimum is 8 characters                    |
| `Provider`             | userId, facilityId, npi, phone, dateHired, address                                                                                                                                |
| `Patient`              | userId (nullable until the patient registers), providerId, facilityId, firstName, lastName, email, phone, dob, sex, heightIn, weightLb, address, unit, city, state, zip           |

## Clinical

| Entity                                             | Fields                                                                                                                                                                                                                                                                                                                                                                          |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PatientClinicalInfo` (could merge into `Patient`) | prescribedPressure (pass 2: the provider enters a pressure range, so likely min and max; entering it activates the device), approvalStatus (pass 2: "Waiting Dr Approval" on Home), onboarding checklist flags "Add Profile Data" and "Fit Your Mask" (derived or stored), sleepStudy (bool), sleepStudyDate, atHomeStudy, maskFitting (bool), maskFittingDate, lastAppointment |
| `PatientNote`                                      | patientId, authorId, body, createdAt                                                                                                                                                                                                                                                                                                                                            |
| `PatientDocument`                                  | patientId, fileUrl, name, uploadedAt                                                                                                                                                                                                                                                                                                                                            |
| `ProviderMessage`                                  | patientId, providerId, body, direction, createdAt (portal "Message Patient" and app "Notify Healthcare Provider")                                                                                                                                                                                                                                                               |

## Devices

| Entity           | Fields                                                                                                                                                                                                                                                                                                                       |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DeviceModel`    | name (KAM, KAM 2…), created via the "Add New Model" screen                                                                                                                                                                                                                                                                   |
| `Device`         | deviceModelId, deviceId (GS1-style string like `(01)0082…(17)…(10)…(21)…`), manufactureDate, facilityId, patientId (nullable), lastConnectedAt, status (active / inactive); (pass 2) shortId (app shows e.g. `0A34C829`), displayName (e.g. "Kälm CPAP 2.0"), pairedAt, connected (bluetooth state, likely client-side only) |
| `DeviceSettings` | deviceId, ramp (auto / manual), smartAlarm (set / off, alarm time), pressure (cmH2O), humidity or percent (80%); (pass 2) smartAlarmTime (e.g. 7:30 AM, set via Change Alarm), bedtime (e.g. 11:00 PM)                                                                                                                       |

## Therapy data

| Entity           | Fields                                                                                                                                                      |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `TherapySession` | patientId, deviceId, startedAt, endedAt, usageHours, leakLpm, eventsPerHour, movementCount, snoringMinutes, bloodOxygenPct, heartRateBpm, kalmScore (0–100) |

## Mobile app

| Entity                              | Fields                                                                                                                                                     |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Notification`                      | userId, type (alert / message), title, body, status (open / complete / dismissed), createdAt; (pass 2) from (sender), "No notifications" empty state       |
| `Article`                           | title, body, category (e.g. "Sleep Apnea 101"); (pass 2) a Discover section "How to Improve Sleep" groups articles, and the Home screen has an intro video |
| `NotificationPreference` (pass 2)   | userId, notificationsEnabled, faceIdEnabled (Profile > Permissions; Face ID is probably device-local)                                                      |
| `AdminBroadcast` (pass 2, optional) | senderId, subject, body, sentAt. From the Super Admin Settings prompt "Send an urgent email to all facilities?"                                            |

## Design notes

- **One `User` table with a `role` column** is simpler than separate tables: all four roles share the same login, forgot-password and update-password flows.
- **`Patient.userId` must be nullable**: providers create patients first, and patients register later (see the Super Admin "Unregistered Filter" and the "1 inactive" badge).
- **Kälm Score** is an average of Usage, Leaks, Events and Movement. Compute it from `TherapySession` rather than store it; a stored snapshot is fine if history is needed.
- **Snoring units differ** between screens (hours in the provider portal, minutes in the super admin). Pick one, probably minutes, and store that.
- **Stats range** is up to 30 consecutive days, plus 7-day and 30-day views. One `TherapySession` per night supports all of these.
- **Dashboard counts** (patients, facilities, providers, devices) are aggregates, not entities.

- **(pass 2) Messaging**: the app's Notification Center has a messages thread with the provider (titled with the facility name, e.g. "The CPAP Express"). `ProviderMessage` covers it, and alerts are separate `Notification` rows.
- **(pass 2) Two device IDs**: the portals show a long GS1-style ID, the app shows a short 8-character ID. Decide which is the primary key and keep the other as an alternate unique column.
- **(pass 2) Live therapy run** (Run / Pause / Reset / "Hold to End" with a timer) is device and app state. Only the finished `TherapySession` needs persisting.
- **(pass 2) The Discover screen shows a "Studio booking" card** (Athletic Club, Jun 22 2021) that looks like leftover template content. No booking entity is proposed; confirm with the designer.
- **(pass 2) Portal Admin settings** show the admin's facility details (address, city, state, zip, unit, phone), so a portal admin belongs to a `Facility`. The Provider screens also carry NPI and date hired for the admin, so `Provider` may be reused for admins.

- **Provider ↔ Facility**: see `provider-facility.md` for how a provider is attached to a facility and the portal admin gap.

## Open questions

1. Which ORM to use in `apps/api` (TypeORM, Prisma, MikroORM)? The DB is not wired up yet.
2. Is the prescribed pressure a single value or a min/max range? The app says "range", the portals show one value.
3. Is the Discover booking card real? Should the app store bookings?
4. Should the super admin broadcast email be persisted?
