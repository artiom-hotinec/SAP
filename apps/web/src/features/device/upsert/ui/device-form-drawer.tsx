'use client';

import { useId } from 'react';
import { Controller } from 'react-hook-form';
import type { DeviceDto } from '@/shared/api';
import { UiButton } from '@/shared/ui/ui-button';
import { UiDrawer } from '@/shared/ui/ui-drawer';
import { UiDropdown } from '@/shared/ui/ui-dropdown';
import { UiInput } from '@/shared/ui/ui-input';
import { useDeviceForm } from '../model/use-device-form';
import { validateDeviceId } from '../model/validation';
import { ScanIcon } from './scan-icon';

// `UiDropdown` treats '' as "nothing selected", so "None" needs its own value.
const NO_FACILITY = 'none';

export interface DeviceFormDrawerProps {
  open: boolean;
  /** Edit this device; omit to create a new one. */
  device?: DeviceDto;
  onClose: () => void;
}

function ReadonlyRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="mb-1 text-body-sm font-light text-grey-600">{label}</p>
      <p className="min-h-10 truncate p-2.5 text-body-md text-grey-800">
        {value}
      </p>
    </div>
  );
}

/**
 * Mount it only while it is open: the form state lives here, so a fresh mount
 * always starts from the device's current values (or an empty form).
 */
export function DeviceFormDrawer({
  open,
  device,
  onClose,
}: DeviceFormDrawerProps) {
  const formId = useId();
  const {
    mode,
    form,
    step,
    enterManually,
    back,
    canGoBack,
    canSave,
    onSubmit,
    isPending,
    facilityOptions,
    modelPreview,
    manufactureDatePreview,
    lastConnectedPreview,
    serverError,
  } = useDeviceForm({ device, onDone: onClose });
  const {
    register,
    control,
    formState: { errors },
  } = form;

  return (
    <UiDrawer
      open={open}
      title={mode === 'edit' ? 'Edit Device' : 'Add Device'}
      onClose={onClose}
      footer={
        <>
          {serverError && (
            <p role="alert" className="mb-3 text-body-sm text-red-400">
              {serverError}
            </p>
          )}
          <div className="flex items-center">
            {canGoBack && (
              <UiButton variant="link" className="w-16" onClick={back}>
                Back
              </UiButton>
            )}
            <div className="ml-auto flex items-center gap-10">
              <UiButton variant="cancel" onClick={onClose}>
                Cancel
              </UiButton>
              <UiButton
                type="submit"
                form={formId}
                className="w-32.5"
                disabled={isPending || !canSave}
              >
                Save
              </UiButton>
            </div>
          </div>
        </>
      }
    >
      <form id={formId} noValidate onSubmit={onSubmit}>
        {step === 'choose' ? (
          <div className="mx-auto flex w-57 flex-col items-center gap-3 rounded-lg border border-dashed border-grey-500 px-6 py-9">
            <ScanIcon className="size-12 text-grey-700" />
            {/* Scanning isn't built yet. */}
            <UiButton
              variant="cancel"
              className="text-body-md"
              disabled
              title="Coming soon"
            >
              Scan KAM device
            </UiButton>
            <UiButton
              variant="link"
              className="text-body-md"
              onClick={enterManually}
            >
              Enter manually
            </UiButton>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <UiInput
              size="sm"
              label="Device ID"
              autoComplete="off"
              spellCheck={false}
              error={errors.deviceId?.message}
              {...register('deviceId', { validate: validateDeviceId })}
            />
            <ReadonlyRow label="Model" value={modelPreview} />
            <ReadonlyRow
              label="Date of Manufacture"
              value={manufactureDatePreview}
            />
            <ReadonlyRow
              label="Last Connected On"
              value={lastConnectedPreview}
            />
            <Controller
              control={control}
              name="facilityId"
              render={({ field, fieldState }) => (
                <UiDropdown
                  size="sm"
                  label="Facility (if known)"
                  placeholder="None"
                  options={[
                    { value: NO_FACILITY, label: 'None' },
                    ...facilityOptions,
                  ]}
                  value={field.value || NO_FACILITY}
                  onChange={(value) =>
                    field.onChange(value === NO_FACILITY ? '' : value)
                  }
                  error={fieldState.error?.message}
                />
              )}
            />
          </div>
        )}
      </form>
    </UiDrawer>
  );
}
