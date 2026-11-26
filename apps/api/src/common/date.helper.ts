/** ISO date string from a DTO -> Date, or null when omitted. */
export const toDate = (s?: string) => (s ? new Date(s) : null);
