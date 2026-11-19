import type { ErrorType } from '@/shared/api';
import type { FacilityFormValues } from './form-values';

/** 409 types `POST /facilities` answers with, and the field each belongs to. */
const CONFLICTS = {
  'ein-exists': {
    field: 'ein',
    step: 1,
    message: 'Facility with this EIN already exists',
  },
  // The contact person becomes the facility admin, a user with this email.
  'email-exists': {
    field: 'contactEmail',
    step: 3,
    message: 'A user with this email already exists',
  },
} as const satisfies Record<
  string,
  { field: keyof FacilityFormValues; step: number; message: string }
>;

export type FacilityConflict = (typeof CONFLICTS)[keyof typeof CONFLICTS];

/** The form field a 409 belongs to, or `undefined` for any other error. */
export function getConflict(
  error: ErrorType<unknown> | null,
): FacilityConflict | undefined {
  if (error?.response?.status !== 409) {
    return undefined;
  }

  const data = error.response.data as { type?: unknown } | undefined;
  const type = data?.type;

  return typeof type === 'string' && type in CONFLICTS
    ? CONFLICTS[type as keyof typeof CONFLICTS]
    : undefined;
}
