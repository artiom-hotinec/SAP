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
