import { isValidGtin14 } from '@/shared/lib';

export function validateName(value: string): string | true {
  return value.trim() ? true : 'Model name is required';
}

/** Optional. When filled: 14 digits with a valid check digit (stricter than the API, which checks only the digit count). */
export function validateGtin(value: string): string | true {
  const gtin = value.trim();
  if (!gtin) return true;
  if (!/^\d{14}$/.test(gtin)) return 'GTIN must be 14 digits';

  return isValidGtin14(gtin) ? true : 'GTIN check digit is wrong';
}
