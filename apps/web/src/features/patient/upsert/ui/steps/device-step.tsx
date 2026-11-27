import { Controller, useWatch } from 'react-hook-form';
import { useDevicesQuery } from '@/entities/device';
import { UiDropdown } from '@/shared/ui/ui-dropdown';
import { UiInput } from '@/shared/ui/ui-input';
import { KEEP_DEVICE, hasDevice } from '../../model/form-values';
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

  const isEdit = form.formState.defaultValues?.deviceId === KEEP_DEVICE;

  const options = [
    ...(isEdit ? [{ value: KEEP_DEVICE, label: 'Keep current device' }] : []),
    { value: '', label: isEdit ? 'No device (unassign)' : 'No device' },
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
            label={isEdit ? 'Device' : 'Device (Optional)'}
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
      {hasDevice(deviceId) && (
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
