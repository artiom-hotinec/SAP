import type { UserDto } from '@/shared/api';

export function getDisplayName(
  user: Pick<UserDto, 'firstName' | 'lastName' | 'email'>,
): string {
  const fullName = [user.firstName, user.lastName]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(' ');

  return fullName || user.email;
}
