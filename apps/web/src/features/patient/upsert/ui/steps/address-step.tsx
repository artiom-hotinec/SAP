import { Controller } from 'react-hook-form';
import {
  validateAddress,
  validateCity,
  validateState,
  validateZip,
} from '@/entities/patient';
import { US_STATES } from '@/shared/config';
import { UiDropdown } from '@/shared/ui/ui-dropdown';
import { UiInput } from '@/shared/ui/ui-input';
import type { PatientStepProps } from './types';

export function AddressStep({ form }: PatientStepProps) {
  const {
    register,
    control,
    formState: { errors },
  } = form;

  return (
    <div className="flex flex-col gap-5">
      <UiInput
        label="Street address"
        autoComplete="off"
        error={errors.address?.message}
        {...register('address', { validate: validateAddress })}
      />
      <div className="flex items-start gap-4">
        <UiInput
          label="Unit/Suite (Optional)"
          autoComplete="off"
          {...register('unit')}
        />
        <UiInput
          label="Zip code"
          autoComplete="off"
          inputMode="numeric"
          error={errors.zip?.message}
          {...register('zip', { validate: validateZip })}
        />
      </div>
      <div className="flex items-start gap-4">
        <UiInput
          label="City"
          autoComplete="off"
          error={errors.city?.message}
          {...register('city', { validate: validateCity })}
        />
        <div className="min-w-0 flex-1">
          <Controller
            control={control}
            name="state"
            rules={{ validate: validateState }}
            render={({ field, fieldState }) => (
              <UiDropdown
                label="State"
                placeholder="Select"
                options={US_STATES}
                value={field.value}
                onChange={field.onChange}
                error={fieldState.error?.message}
              />
            )}
          />
        </div>
      </div>
    </div>
  );
}
