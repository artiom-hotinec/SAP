import type { UserDto } from '@/shared/api';
import { getInitials as getNameInitials } from '@/shared/lib';

export function getInitials(
  user: Pick<UserDto, 'firstName' | 'lastName' | 'email'>,
): string {
  return getNameInitials(user, user.email);
}
