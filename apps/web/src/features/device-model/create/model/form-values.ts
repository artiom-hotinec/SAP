import type { AddDeviceModelItemDto } from '@/shared/api';

/** `gtin` is optional and may be empty. */
export interface DeviceModelFormValues {
  name: string;
  gtin: string;
}

export const EMPTY_DEVICE_MODEL_VALUES: DeviceModelFormValues = {
  name: '',
  gtin: '',
};

/** `POST /device-model` body: values trimmed, `gtin` omitted when empty. */
export function toCreateDto(
  values: DeviceModelFormValues,
): AddDeviceModelItemDto {
  const name = values.name.trim();
  const gtin = values.gtin.trim();

  return gtin ? { name, gtin } : { name };
}
