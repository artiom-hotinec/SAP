'use client';

import { useForm } from 'react-hook-form';
import type { ErrorType } from '@/shared/api';
import { EMPTY_DEVICE_MODEL_VALUES, toCreateDto } from './form-values';
import type { DeviceModelFormValues } from './form-values';
import { useCreateDeviceModel } from './use-create-device-model';

export const GENERIC_ERROR_MESSAGE = 'Something went wrong. Please try again.';
export const MODEL_EXISTS_MESSAGE =
  'A model with this name or GTIN already exists';

/** 409 `device-model-exists` → name field; 400 → GTIN field. */
function getFieldError(
  error: ErrorType<unknown> | null,
): { field: keyof DeviceModelFormValues; message: string } | null {
  const status = error?.response?.status;
  const data = error?.response?.data as { type?: unknown } | undefined;

  if (status === 409 && data?.type === 'device-model-exists') {
    return { field: 'name', message: MODEL_EXISTS_MESSAGE };
  }
  if (status === 400) {
    return { field: 'gtin', message: 'GTIN must be 14 digits' };
  }

  return null;
}

export interface UseDeviceModelFormOptions {
  /** Called after a successful save. */
  onDone: () => void;
}

export function useDeviceModelForm({ onDone }: UseDeviceModelFormOptions) {
  const form = useForm<DeviceModelFormValues>({
    mode: 'onChange',
    defaultValues: EMPTY_DEVICE_MODEL_VALUES,
  });
  const { mutate, isPending, error } = useCreateDeviceModel({
    onSuccess: onDone,
  });

  const onSubmit = form.handleSubmit((values) =>
    mutate(toCreateDto(values), {
      onError: (submitError) => {
        const fieldError = getFieldError(submitError);
        if (fieldError) {
          form.setError(fieldError.field, { message: fieldError.message });
        }
      },
    }),
  );

  return {
    form,
    onSubmit,
    isPending,
    /** Message for failures that don't belong to a field. */
    serverError:
      error && !getFieldError(error) ? GENERIC_ERROR_MESSAGE : undefined,
  };
}
