import { toDeviceDto } from './device.mapper.js';
import type { DeviceWithNames } from './device.mapper.js';

const device = (patientId: string | null) =>
  ({
    id: 'd1',
    deviceId: '(01)00000000000000(11)210821(10)A(21)1',
    deviceModel: { name: 'Model' },
    facility: null,
    manufactureDate: new Date(Date.UTC(2021, 7, 21)),
    lastConnectedAt: null,
    patientId,
  }) as unknown as DeviceWithNames;

describe('toDeviceDto', () => {
  it('marks a device without a patient as not assigned', () => {
    expect(toDeviceDto(device(null)).assigned).toBe(false);
  });

  it('marks a device with a patient as assigned', () => {
    expect(toDeviceDto(device('p1')).assigned).toBe(true);
  });
});
