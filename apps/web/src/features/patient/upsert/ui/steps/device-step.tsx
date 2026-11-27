import { Controller, useWatch } from 'react-hook-form';
import { useDevicesQuery } from '@/entities/device';
import { UiDropdown } from '@/shared/ui/ui-dropdown';
import { UiInput } from '@/shared/ui/ui-input';
import { validatePressureWhen } from '../../model/validation';
import type { PatientStepProps } from './types';

export function DeviceStep({ form }: PatientStepProps) {
  const {
    register,
    control,
    getValues,
    setValue,
    clearErrors,
    formState: { errors },
  } = form;
  const deviceId = useWatch({ control, name: 'deviceId' });
  const { data: devices = [] } = useDevicesQuery();

  const options = [
    { value: '', label: 'No device' },
    ...devices
      .filter((device) => !device.assigned)
      .map((device) => ({
        value: device.deviceId,
        label: `${device.modelName} · ${device.deviceId}`,
      })),
  ];

  return (
    <div className="flex flex-col gap-5">
      <Controller
        control={control}
        name="deviceId"
        render={({ field }) => (
          <UiDropdown
            label="Device (Optional)"
            options={options}
            value={field.value}
            error={errors.deviceId?.message}
            onChange={(value) => {
              field.onChange(value);
              if (value === '') setValue('prescribedPressure', '');
              clearErrors('prescribedPressure');
            }}
          />
        )}
      />
      {deviceId !== '' && (
        <UiInput
          label="Prescribed pressure, cmH2O"
          inputMode="decimal"
          autoComplete="off"
          error={errors.prescribedPressure?.message}
          {...register('prescribedPressure', {
            validate: (value) =>
              validatePressureWhen(getValues('deviceId'), value),
          })}
        />
      )}
    </div>
  );
}
