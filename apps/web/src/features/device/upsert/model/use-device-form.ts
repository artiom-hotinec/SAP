'use client';

import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useForm } from 'react-hook-form';
import { parseDeviceId } from '@/entities/device';
import { useDeviceModelByGtinQuery } from '@/entities/device-model';
import { useFacilitiesQuery } from '@/entities/facility';
import { FacilitySortBy } from '@/shared/api';
import type { DeviceDto } from '@/shared/api';
import { formatDateTime, formatDateUtc } from '@/shared/lib';
import { EMPTY_DEVICE_VALUES } from './form-values';
import type { DeviceFormValues } from './form-values';
import { mapDeviceError } from './map-device-error';
import { useUpsertDevice } from './use-upsert-device';

export const GENERIC_ERROR_MESSAGE = 'Something went wrong. Please try again.';

export type DeviceFormStep = 'choose' | 'manual';

export interface UseDeviceFormOptions {
  /** Edit this device; omit to create a new one. */
  device?: DeviceDto;
  /** Called after a successful save. */
  onDone: () => void;
}

/**
 * State of the Add / Edit Device drawer. Create starts at `choose` (scan or
 * enter manually); edit goes straight to `manual`. Model and Date of
 * Manufacture are read-only previews derived from the typed Device ID.
 */
export function useDeviceForm({ device, onDone }: UseDeviceFormOptions) {
  const mode = device ? 'edit' : 'create';
  const isEdit = mode === 'edit';

  const form = useForm<DeviceFormValues>({
    mode: 'onChange',
    defaultValues: device
      ? { ...EMPTY_DEVICE_VALUES, deviceId: device.deviceId }
      : EMPTY_DEVICE_VALUES,
  });
  const [step, setStep] = useState<DeviceFormStep>(
    isEdit ? 'manual' : 'choose',
  );
  const { submit, isPending, error } = useUpsertDevice({
    deviceId: device?.id,
    onSuccess: onDone,
  });

  // Facility dropdown. `DeviceDto` has only the facility *name*, so on edit the
  // current facility is found by name once the list has loaded.
  const facilities = useFacilitiesQuery({ sortBy: FacilitySortBy.name });
  const currentFacility = device?.facilityName
    ? facilities.data?.find((item) => item.name === device.facilityName)
    : undefined;
  const facilityOptions = (facilities.data ?? [])
    .filter((item) => item.active || item.id === currentFacility?.id)
    .map((item) => ({ value: item.id, label: item.name }));
  // Saving before the list loads would send "no facility" and clear it.
  const facilityReady = !device?.facilityName || !!facilities.data;

  const { getFieldState, getValues, setValue } = form;
  useEffect(() => {
    if (!currentFacility) return;
    // Don't override a choice the user already made.
    if (getFieldState('facilityId').isDirty || getValues('facilityId')) return;
    setValue('facilityId', currentFacility.id, { shouldDirty: false });
  }, [currentFacility, getFieldState, getValues, setValue]);

  // Read-only previews derived from the Device ID.
  const parsed = parseDeviceId(form.watch('deviceId') ?? '');
  const modelQuery = useDeviceModelByGtinQuery(
    parsed.ok ? parsed.gtin : undefined,
  );
  const modelPreview = !parsed.ok
    ? '--'
    : modelQuery.isSuccess
      ? modelQuery.data.name
      : modelQuery.isPending
        ? '...'
        : modelQuery.error?.response?.status === 404
          ? 'Unknown model'
          : '--';
  const manufactureDatePreview = parsed.ok
    ? formatDateUtc(parsed.productionDate)
    : '--';
  // Runtime data: never part of the ID, so it only shows what the device reported.
  const lastConnectedPreview = device?.lastConnectedAt
    ? formatDateTime(device.lastConnectedAt)
    : '--';

  const save = form.handleSubmit((values) =>
    submit(values, {
      onError: (submitError) => {
        const fieldError = mapDeviceError(submitError, { isEdit });
        if (fieldError) {
          form.setError(fieldError.field, { message: fieldError.message });
        }
      },
    }),
  );

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (step === 'manual' && facilityReady) return save();
  };

  return {
    mode,
    form,
    step,
    enterManually: () => setStep('manual'),
    back: () => setStep('choose'),
    canGoBack: !isEdit && step === 'manual',
    canSave: step === 'manual' && facilityReady,
    onSubmit,
    isPending,
    facilityOptions,
    modelPreview,
    manufactureDatePreview,
    lastConnectedPreview,
    /** Message for failures that don't belong to a field. */
    serverError:
      error && !mapDeviceError(error, { isEdit })
        ? GENERIC_ERROR_MESSAGE
        : undefined,
  };
}
