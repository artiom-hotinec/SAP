import type { UserDtoRole } from '@/shared/api';

const ROLE_LABELS: Record<UserDtoRole, string> = {
  PATIENT: 'Patient',
  PROVIDER: 'Provider',
  PORTAL_ADMIN: 'Portal Admin',
  SUPER_ADMIN: 'Super Admin',
};

export function getRoleLabel(role: UserDtoRole): string {
  return ROLE_LABELS[role];
}
