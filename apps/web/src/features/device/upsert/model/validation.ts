import { getDeviceIdErrorMessage, parseDeviceId } from '@/entities/device';

export function validateDeviceId(value: string): string | true {
  if (!value.trim()) return 'Device ID is required';

  const parsed = parseDeviceId(value);

  return parsed.ok ? true : getDeviceIdErrorMessage(parsed.reason);
}
