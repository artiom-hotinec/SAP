/**
 * True for a GTIN-14: exactly 14 digits with a valid check digit.
 * Same algorithm as `hasValidGtinChecksum` in `apps/api/src/device/device-id.parser.ts`:
 * the leftmost digit has weight 3, then 1, 3, 1 … up to the 13th digit;
 * the 14th digit is the check digit.
 */
export function isValidGtin14(value: string): boolean {
  if (!/^\d{14}$/.test(value)) return false;

  let sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += Number(value[i]) * (i % 2 === 0 ? 3 : 1);
  }
  return (10 - (sum % 10)) % 10 === Number(value[13]);
}
