import type { ErrorType } from '@/shared/api';

export const EIN_EXISTS_MESSAGE = 'Facility with this EIN already exists';

/** `POST /facilities` answers 409 `{ type: 'ein-exists' }` for a duplicate EIN. */
export function isEinConflict(error: ErrorType<unknown> | null): boolean {
  if (error?.response?.status !== 409) {
    return false;
  }

  const data = error.response.data as { type?: unknown } | undefined;

  return data?.type === 'ein-exists';
}
