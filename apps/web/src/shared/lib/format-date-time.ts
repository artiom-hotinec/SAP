const dateTimeFormat = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'long',
  timeStyle: 'short',
});

/** Formats an ISO date string as e.g. "January 23, 2023 at 10:44 PM". */
export function formatDateTime(value: string | Date): string {
  return dateTimeFormat.format(new Date(value));
}
