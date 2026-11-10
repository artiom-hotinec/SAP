const longDateFormat = new Intl.DateTimeFormat('en-US', { dateStyle: 'long' });

/** Formats an ISO date string as e.g. "August 2, 2021". */
export function formatDate(value: string | Date): string {
  return longDateFormat.format(new Date(value));
}
