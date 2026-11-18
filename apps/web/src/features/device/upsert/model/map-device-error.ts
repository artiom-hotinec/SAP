import { getDeviceIdErrorMessage } from '@/entities/device';
import type { DeviceIdParseReason } from '@/entities/device';
import type { ErrorType } from '@/shared/api';
import type { DeviceFormValues } from './form-values';

export interface FieldError {
  field: keyof DeviceFormValues;
  message: string;
}

const REASONS: DeviceIdParseReason[] = [
  'bad-format',
  'unknown-ai',
  'duplicate-ai',
  'missing-ai',
  'bad-value',
  'bad-gtin-checksum',
  'bad-date',
];

/**
 * Maps the device endpoints' errors to a form field:
 * 400 `invalid-device-id` / `unknown-device-model`, 409 `device-exists`,
 * 400 `facility-inactive` and 404 (unknown facility; when editing, a 404 means
 * the device itself is gone, so it stays a generic error).
 * Returns `null` for anything else (the form shows a generic alert).
 */
export function mapDeviceError(
  error: ErrorType<unknown> | null,
  { isEdit }: { isEdit: boolean },
): FieldError | null {
  const status = error?.response?.status;
  const data = error?.response?.data as
    { type?: unknown; reason?: unknown } | undefined;

  if (status === 400 && data?.type === 'invalid-device-id') {
    const reason = REASONS.find((item) => item === data.reason);

    return {
      field: 'deviceId',
      message: reason
        ? getDeviceIdErrorMessage(reason)
        : 'Device ID is not valid',
    };
  }
  if (status === 400 && data?.type === 'unknown-device-model') {
    return {
      field: 'deviceId',
      message: 'No model with this GTIN. Add the model first.',
    };
  }
  if (status === 409 && data?.type === 'device-exists') {
    return { field: 'deviceId', message: 'This device is already registered' };
  }
  if (status === 400 && data?.type === 'facility-inactive') {
    return { field: 'facilityId', message: 'This facility is inactive' };
  }
  if (status === 404 && !isEdit) {
    return { field: 'facilityId', message: 'Facility not found' };
  }

  return null;
}
