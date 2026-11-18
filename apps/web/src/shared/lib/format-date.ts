const longDateFormat = new Intl.DateTimeFormat('en-US', { dateStyle: 'long' });

/** Formats an ISO date string as e.g. "August 2, 2021". */
export function formatDate(value: string | Date): string {
  return longDateFormat.format(new Date(value));
}

const utcDateFormat = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'long',
  timeZone: 'UTC',
});

/**
 * Like `formatDate`, but reads the date in UTC. Use it for date-only values the
 * API stores as UTC midnight (e.g. a manufacture date), which would otherwise
 * show the previous day in timezones west of UTC.
 */
export function formatDateUtc(value: string | Date): string {
  return utcDateFormat.format(new Date(value));
}
