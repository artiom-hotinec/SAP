import type { UserDto } from '@/shared/api';

export function getInitials(
  user: Pick<UserDto, 'firstName' | 'lastName' | 'email'>,
): string {
  const initials = [user.firstName, user.lastName]
    .map((part) => part?.trim().charAt(0))
    .filter(Boolean)
    .join('');

  return (initials || user.email.trim().charAt(0)).toUpperCase();
}
