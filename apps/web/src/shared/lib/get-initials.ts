/**
 * Upper-case initials from a first and last name ("Elayne Burgess" → "EB").
 * Falls back to the first character of `fallback` (e.g. an email) when both
 * names are empty.
 */
export function getInitials(
  name: { firstName?: string | null; lastName?: string | null },
  fallback = '',
): string {
  const initials = [name.firstName, name.lastName]
    .map((part) => part?.trim().charAt(0))
    .filter(Boolean)
    .join('');

  return (initials || fallback.trim().charAt(0)).toUpperCase();
}
