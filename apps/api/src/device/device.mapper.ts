import { Prisma } from '../generated/prisma/client.js';
import { DeviceDto } from './dto.js';

export const deviceInclude = {
  deviceModel: { select: { name: true } },
  facility: { select: { name: true } },
} satisfies Prisma.DeviceInclude;

export type DeviceWithNames = Prisma.DeviceGetPayload<{
  include: typeof deviceInclude;
}>;

export const toDeviceDto = (device: DeviceWithNames): DeviceDto => ({
  id: device.id,
  deviceId: device.deviceId,
  modelName: device.deviceModel.name,
  facilityName: device.facility?.name ?? null,
  manufactureDate: device.manufactureDate,
  lastConnectedAt: device.lastConnectedAt,
  assigned: device.patientId !== null,
});
