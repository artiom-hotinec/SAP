const DOB_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** Optional date of birth as `YYYY-MM-DD`: a real calendar date, not in the future. */
export function validateDob(dob: string, now: Date = new Date()) {
  const value = dob.trim();

  if (value === '') return true;
  if (!DOB_PATTERN.test(value)) return 'Use YYYY-MM-DD';

  const date = new Date(`${value}T00:00:00Z`);

  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
  ) {
    return 'Invalid date';
  }

  return date.getTime() <= now.getTime() || 'Date can’t be in the future';
}

/** A real calendar date as `YYYY-MM-DD`; any day is allowed. */
function checkDate(value: string) {
  if (!DOB_PATTERN.test(value)) return 'Use YYYY-MM-DD';

  const date = new Date(`${value}T00:00:00Z`);

  return (
    (!Number.isNaN(date.getTime()) &&
      date.toISOString().slice(0, 10) === value) ||
    'Invalid date'
  );
}

/** Optional date (`YYYY-MM-DD`). */
export function validateOptionalDate(date: string) {
  const value = date.trim();

  return value === '' ? true : checkDate(value);
}

/** A date required only while its flag is on (`maskFitting`, `sleepStudy`). */
export function validateDateWhen(enabled: boolean, date: string) {
  if (!enabled) return true;

  const value = date.trim();

  return value === '' ? 'Date is required' : checkDate(value);
}

interface RangeOptions {
  min: number;
  max: number;
  integer?: boolean;
}

/** Optional number within `[min, max]`; `integer` rejects fractions. */
export function validateNumberInRange(
  value: string,
  { min, max, integer = false }: RangeOptions,
) {
  const text = value.trim();

  if (text === '') return true;

  if (!(integer ? /^\d+$/ : /^\d+(\.\d+)?$/).test(text)) {
    return integer ? 'Enter a whole number' : 'Enter a number';
  }

  const number = Number(text);

  return (
    (number >= min && number <= max) || `Must be between ${min} and ${max}`
  );
}

/** Prescribed pressure (cmH2O, 4-20): required once a device is chosen. */
export function validatePressureWhen(deviceId: string, value: string) {
  if (deviceId === '') return true;
  if (value.trim() === '') return 'Pressure is required';

  return validateNumberInRange(value, { min: 4, max: 20 });
}
