'use client';

import { useId } from 'react';
import { UiButton } from '@/shared/ui/ui-button';
import { UiDrawer } from '@/shared/ui/ui-drawer';
import { UiInput } from '@/shared/ui/ui-input';
import { useDeviceModelForm } from '../model/use-device-model-form';
import { validateGtin, validateName } from '../model/validation';

export interface DeviceModelFormDrawerProps {
  open: boolean;
  onClose: () => void;
}

/** Mount it only while it is open, so each open starts with an empty form. */
export function DeviceModelFormDrawer({
  open,
  onClose,
}: DeviceModelFormDrawerProps) {
  const formId = useId();
  const { form, onSubmit, isPending, serverError } = useDeviceModelForm({
    onDone: onClose,
  });
  const {
    register,
    formState: { errors },
  } = form;

  return (
    <UiDrawer
      open={open}
      title="Add New Model"
      onClose={onClose}
      footer={
        <>
          {serverError && (
            <p role="alert" className="mb-3 text-body-sm text-red-400">
              {serverError}
            </p>
          )}
          <div className="flex items-center justify-end gap-10">
            <UiButton variant="cancel" onClick={onClose}>
              Cancel
            </UiButton>
            <UiButton
              type="submit"
              form={formId}
              className="w-32.5"
              disabled={isPending}
            >
              Save
            </UiButton>
          </div>
        </>
      }
    >
      <form
        id={formId}
        noValidate
        onSubmit={onSubmit}
        className="flex w-81 max-w-full flex-col gap-4"
      >
        <UiInput
          size="sm"
          label="Model"
          placeholder="Enter model name"
          autoComplete="off"
          error={errors.name?.message}
          {...register('name', { validate: validateName })}
        />
        <UiInput
          size="sm"
          label="GTIN (optional)"
          placeholder="14-digit GTIN"
          autoComplete="off"
          inputMode="numeric"
          error={errors.gtin?.message}
          {...register('gtin', { validate: validateGtin })}
        />
      </form>
    </UiDrawer>
  );
}
