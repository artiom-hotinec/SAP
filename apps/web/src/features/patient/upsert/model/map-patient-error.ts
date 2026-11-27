import type { ErrorType } from '@/shared/api';
import type { PatientFormStep } from '../config/steps';
import type { PatientFormValues } from './form-values';

export interface PatientFieldError {
  field: keyof PatientFormValues;
  step: PatientFormStep;
  message: string;
}

/** `type`s `POST /patients` and `PATCH /patients/:id` answer with, and the field each belongs to. */
const ERRORS: Record<string, Record<number, PatientFieldError>> = {
  'email-exists': {
    409: {
      field: 'email',
      step: 1,
      message: 'A patient with this email already exists',
    },
  },
  'provider-not-found': {
    404: { field: 'providerId', step: 3, message: 'Provider not found' },
  },
  'device-not-found': {
    404: { field: 'deviceId', step: 5, message: 'Device not found' },
  },
  'device-unavailable': {
    409: {
      field: 'deviceId',
      step: 5,
      message: 'This device is no longer available',
    },
  },
};

/** The field a server error belongs to, or `undefined` (generic alert). */
export function mapPatientError(
  error: ErrorType<unknown> | null,
): PatientFieldError | undefined {
  const status = error?.response?.status;
  const type = (error?.response?.data as { type?: unknown } | undefined)?.type;

  if (status === undefined || typeof type !== 'string') return undefined;

  return Object.hasOwn(ERRORS, type) ? ERRORS[type][status] : undefined;
}
