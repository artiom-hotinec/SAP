import type { AddDeviceItemDto, UpdateDeviceItemDto } from '@/shared/api';

/** `facilityId` is `''` when no facility is chosen ("if known"). */
export interface DeviceFormValues {
  deviceId: string;
  facilityId: string;
}

export const EMPTY_DEVICE_VALUES: DeviceFormValues = {
  deviceId: '',
  facilityId: '',
};

/** `POST /device` body: the ID is trimmed, `facilityId` omitted when empty. */
export function toCreateDto(values: DeviceFormValues): AddDeviceItemDto {
  const deviceId = values.deviceId.trim();

  return values.facilityId
    ? { deviceId, facilityId: values.facilityId }
    : { deviceId };
}

/**
 * `PATCH /device/:id` body. The API replaces the facility with whatever is sent
 * (omitted = no facility), so clearing the dropdown to "None" takes effect.
 */
export function toUpdateDto(values: DeviceFormValues): UpdateDeviceItemDto {
  return toCreateDto(values);
}
