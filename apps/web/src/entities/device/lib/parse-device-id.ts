import { isValidGtin14 } from '@/shared/lib';

// Client port of `parseDeviceId` in apps/api/src/device/device-id.parser.ts
// (format: apps/api/docs/device-id.md), e.g.
// (01)00827002005112(11)210821(10)1234(21)8234
// Used to preview Model / Date of Manufacture and to validate before submit;
// the server stays the source of truth.

export type DeviceIdParseReason =
  | 'bad-format'
  | 'unknown-ai'
  | 'duplicate-ai'
  | 'missing-ai'
  | 'bad-value'
  | 'bad-gtin-checksum'
  | 'bad-date';

export type ParsedDeviceId =
  | {
      ok: true;
      /** GTIN-14 from AI (01); identifies the device model. */
      gtin: string;
      /** Production date from AI (11), UTC midnight. */
      productionDate: Date;
      lot: string;
      serial: string;
      /** Normalized ID: fixed AI order, no whitespace. */
      canonical: string;
    }
  | { ok: false; reason: DeviceIdParseReason };

const AI_VALUE_PATTERNS: Record<string, RegExp> = {
  '01': /^\d{14}$/,
  '11': /^\d{6}$/,
  '10': /^[\x21-\x7e]{1,20}$/,
  '21': /^[\x21-\x7e]{1,20}$/,
};

const REQUIRED_AIS = ['01', '11', '10', '21'];
const FORMAT_PATTERN = /^(?:\(\d{2}\)[^()]*)+$/;
const AI_PATTERN = /\((\d{2})\)([^()]*)/g;

const fail = (reason: DeviceIdParseReason): ParsedDeviceId => ({
  ok: false,
  reason,
});

export function parseDeviceId(input: string): ParsedDeviceId {
  const value = input.trim();
  if (!FORMAT_PATTERN.test(value)) return fail('bad-format');

  const values = new Map<string, string>();
  for (const [, ai, aiValue] of value.matchAll(AI_PATTERN)) {
    const pattern = AI_VALUE_PATTERNS[ai];
    if (!pattern) return fail('unknown-ai');
    if (values.has(ai)) return fail('duplicate-ai');
    if (!pattern.test(aiValue)) return fail('bad-value');
    values.set(ai, aiValue);
  }

  if (REQUIRED_AIS.some((ai) => !values.has(ai))) return fail('missing-ai');

  const gtin = values.get('01')!;
  if (!isValidGtin14(gtin)) return fail('bad-gtin-checksum');

  const dateText = values.get('11')!;
  const productionDate = parseYyMmDd(dateText);
  if (!productionDate) return fail('bad-date');

  const lot = values.get('10')!;
  const serial = values.get('21')!;

  return {
    ok: true,
    gtin,
    productionDate,
    lot,
    serial,
    canonical: `(01)${gtin}(11)${dateText}(10)${lot}(21)${serial}`,
  };
}

// The year is read as 20YY. Day 00 ("end of month" in GS1) is rejected.
function parseYyMmDd(text: string): Date | null {
  const year = 2000 + Number(text.slice(0, 2));
  const month = Number(text.slice(2, 4));
  const day = Number(text.slice(4, 6));
  const date = new Date(Date.UTC(year, month - 1, day));
  const valid =
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day;
  return valid ? date : null;
}

const REASON_MESSAGES: Record<DeviceIdParseReason, string> = {
  'bad-format': 'Use the format (01)…(11)…(10)…(21)…',
  'unknown-ai': 'Only (01), (11), (10) and (21) are supported',
  'duplicate-ai': 'Each part can appear only once',
  'missing-ai': 'Device ID must include (01), (11), (10) and (21)',
  'bad-value': 'One of the parts has an invalid value',
  'bad-gtin-checksum': 'The product code (01) has a wrong check digit',
  'bad-date': 'The manufacture date (11) is not a valid date',
};

export function getDeviceIdErrorMessage(reason: DeviceIdParseReason): string {
  return REASON_MESSAGES[reason];
}
