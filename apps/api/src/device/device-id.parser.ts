// Parses the GS1-style device ID shown in the portals, e.g.
// (01)00827002005112(11)210821(10)1234(21)8234
// See docs/device-id.md for the format and open questions.

export type DeviceIdParseReason =
  | 'bad-format'
  | 'unknown-ai'
  | 'duplicate-ai'
  | 'missing-ai'
  | 'bad-value'
  | 'bad-gtin-checksum'
  | 'bad-date';

export class DeviceIdParseError extends Error {
  constructor(
    readonly reason: DeviceIdParseReason,
    message: string,
  ) {
    super(message);
    this.name = 'DeviceIdParseError';
  }
}

export interface ParsedDeviceId {
  /** GTIN-14 from AI (01); identifies the device model. */
  gtin: string;
  /** Production date from AI (11), UTC midnight. */
  productionDate: Date;
  /** Lot number from AI (10). */
  lot: string;
  /** Serial number from AI (21). */
  serial: string;
  /** Normalized ID: fixed AI order, no whitespace. Store this as `Device.deviceId`. */
  canonical: string;
}

// Accepted application identifiers. Anything else is rejected, so format
// drift is noticed instead of silently ignored.
const AI_VALUE_PATTERNS: Record<string, RegExp> = {
  '01': /^\d{14}$/,
  '11': /^\d{6}$/,
  '10': /^[\x21-\x7e]{1,20}$/,
  '21': /^[\x21-\x7e]{1,20}$/,
};

const REQUIRED_AIS = ['01', '11', '10', '21'];

const FORMAT_PATTERN = /^(?:\(\d{2}\)[^()]*)+$/;
const AI_PATTERN = /\((\d{2})\)([^()]*)/g;

export function parseDeviceId(input: string): ParsedDeviceId {
  const value = input.trim();
  if (!FORMAT_PATTERN.test(value)) {
    throw new DeviceIdParseError(
      'bad-format',
      'Device ID must look like (01)…(11)…(10)…(21)…',
    );
  }

  const values = new Map<string, string>();
  for (const [, ai, aiValue] of value.matchAll(AI_PATTERN)) {
    const pattern = AI_VALUE_PATTERNS[ai];
    if (!pattern) {
      throw new DeviceIdParseError('unknown-ai', `Unsupported AI (${ai})`);
    }
    if (values.has(ai)) {
      throw new DeviceIdParseError('duplicate-ai', `AI (${ai}) appears twice`);
    }
    if (!pattern.test(aiValue)) {
      throw new DeviceIdParseError('bad-value', `Invalid value for AI (${ai})`);
    }
    values.set(ai, aiValue);
  }

  for (const ai of REQUIRED_AIS) {
    if (!values.has(ai)) {
      throw new DeviceIdParseError('missing-ai', `AI (${ai}) is required`);
    }
  }

  const gtin = values.get('01')!;
  if (!hasValidGtinChecksum(gtin)) {
    throw new DeviceIdParseError(
      'bad-gtin-checksum',
      'GTIN check digit is wrong',
    );
  }

  const dateText = values.get('11')!;
  const productionDate = parseYyMmDd(dateText);
  const lot = values.get('10')!;
  const serial = values.get('21')!;

  return {
    gtin,
    productionDate,
    lot,
    serial,
    canonical: `(01)${gtin}(11)${dateText}(10)${lot}(21)${serial}`,
  };
}

// GTIN-14: the leftmost digit has weight 3, then 1, 3, 1 … up to the 13th
// digit; the 14th digit is the check digit.
function hasValidGtinChecksum(gtin: string): boolean {
  let sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += Number(gtin[i]) * (i % 2 === 0 ? 3 : 1);
  }
  return (10 - (sum % 10)) % 10 === Number(gtin[13]);
}

// The year is read as 20YY. Day 00 ("end of month" in GS1) is rejected.
function parseYyMmDd(text: string): Date {
  const year = 2000 + Number(text.slice(0, 2));
  const month = Number(text.slice(2, 4));
  const day = Number(text.slice(4, 6));
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new DeviceIdParseError('bad-date', `Invalid production date ${text}`);
  }
  return date;
}
