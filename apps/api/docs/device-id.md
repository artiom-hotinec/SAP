# Device ID and the Add Device flow

Source: Figma file `bTMndFHUptItA2ql9wLiLP` (KAM Lani copy), Super Admin screens "add device", "add device 3 (manual)", "Edit device" and the device list. Provider Portal device detail was read for "Last Connected On".

Status: planning notes. The GS1 parsing and the GTIN-to-model mapping are proposals, not confirmed with the designer or firmware team.

## What the design shows

**Add Device drawer** (Super Admin > Devices):

1. First step: "Scan KAM device" or "Enter manually".
2. The manual form has two bordered inputs: **Device ID** and **Facility (if known)**.
3. **Model**, **Date of Manufacture** and **Last Connected On** are read-only text (no input border). They look filled in from the Device ID, not typed by the admin.

**Device list** columns: Model, Device ID, Date of Manufacture, Facility. Sort options include "A-Z (Facility name)" and "Date of Manufacture".

| Field               | Figma format                                                   | Notes                                                                              |
| ------------------- | -------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Model               | `KAM`, `KAM 2`                                                 | Read-only in the add form, so not a dropdown there                                 |
| Date of Manufacture | `August 21, 2021` (long month, no time)                        | Store as a date, not a timestamp                                                   |
| Last Connected On   | `January 23, 2023 at 10:44 PM`, or `--` when there is no value | Read-only. Some screens use the label "Last Connected"; prefer "Last Connected On" |
| Facility            | `Florida CPAP`                                                 | Labelled "(if known)", so optional                                                 |

## Device ID format

The portals show a GS1-style string. Example matching the Figma sample (same lot, serial and date):

```
(01)00827002005112(11)210821(10)1234(21)8234
```

| Part                 | Meaning                                     | Maps to                                         |
| -------------------- | ------------------------------------------- | ----------------------------------------------- |
| `(01)00827002005112` | GTIN-14, the product ID (check digit valid) | `DeviceModel` (e.g. KAM)                        |
| `(11)210821`         | Production date, `YYMMDD`                   | `Device.manufactureDate` = Aug 21, 2021         |
| `(10)1234`           | Lot number                                  | nothing stores it yet                           |
| `(21)8234`           | Serial number                               | unique per unit; candidate for `Device.shortId` |

Caveats:

- The Figma sample IDs use `(17)000004` where this example uses `(11)…`. In GS1, AI 17 is the **expiry** date, and `000004` is not a valid date, so the sample does not prove the manufacture date is in the ID. Confirm the AI with whoever produces the barcodes.
- **Last Connected On cannot be encoded in the ID.** A barcode is fixed at manufacture; a connection time is runtime data. It is `null` for a new device and is set only when the app reports a connection. The value in the add drawer looks like demo data.
- The app shows a short 8-character ID (e.g. `0A34C829`). How it relates to the long ID is unknown; see the "Two device IDs" note in `db-entities.md`.

## Proposed API changes

**DTO** (`src/device/dto.ts`, already in place):

```ts
export class AddDeviceItemDto {
  @ApiProperty() @IsString() @IsNotEmpty() deviceId: string;
  @ApiProperty({ required: false }) @IsOptional() @IsUUID() facilityId?: string;
}
```

The server derives the rest from `deviceId`.

**Schema** (`prisma/schema.prisma`):

- `Device.facilityId` becomes `String?` (it is required now, with `onDelete: Restrict`).
- `DeviceModel` gets `gtin String? @unique`, used to look up the model from the `(01)` part.

**Parsing** (human-readable form with parentheses, as the portals show it):

```ts
const m = /^\(01\)(\d{14})\(11\)(\d{6})\(10\)([^()]+)\(21\)([^()]+)$/.exec(
  deviceId,
);
// gtin = m[1]; date = 20 + YY, MM, DD from m[2]; lot = m[3]; serial = m[4]
```

The web app (`apps/web/src/entities/device/lib/parse-device-id.ts`) has a client-side port of this parser. It previews Model and Date of Manufacture while the admin types and validates the ID before submit; the API stays the source of truth, so keep the two in sync.

A raw scanned barcode has no parentheses, and the variable-length fields (10, 21) end at an FNC1 separator, so a scanner needs a different parser.

**`POST /devices` behavior:**

- Malformed `deviceId`, unknown GTIN or invalid date: 400.
- Duplicate `deviceId`: 409 `{ type: 'device-exists' }`.
- Unknown `facilityId`: 404. Inactive facility: 400.
- `status` defaults to `INACTIVE`; `pairedAt` and `lastConnectedAt` stay `null`.

## Open questions

1. Is the manufacture date in the ID (AI 11), or does it come from another source?
2. Does each model have a GTIN, and is that the right way to identify the model?
3. How is the 8-character `shortId` produced: from the serial, or generated?
4. Does the scan step use a raw barcode (no parentheses)? If so, the parser must handle FNC1.
5. "Last Connected On" vs "Last Connected": which label is final?
