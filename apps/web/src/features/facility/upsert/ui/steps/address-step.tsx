import { Controller } from 'react-hook-form';
import { US_STATES } from '@/shared/config';
import { UiDropdown } from '@/shared/ui/ui-dropdown';
import { UiInput } from '@/shared/ui/ui-input';
import {
  validateAddress,
  validateCity,
  validateName,
  validateState,
  validateZip,
} from '../../model/validation';
import type { FacilityStepProps } from './types';

export function AddressStep({ form }: FacilityStepProps) {
  const {
    register,
    control,
    formState: { errors },
  } = form;

  return (
    <div className="flex flex-col gap-5">
      <div className="w-105 max-w-full">
        <UiInput
          label="Facility Name"
          autoComplete="off"
          error={errors.name?.message}
          {...register('name', { validate: validateName })}
        />
      </div>
      <div className="w-105 max-w-full">
        <UiInput
          label="Street address"
          autoComplete="off"
          error={errors.address?.message}
          {...register('address', { validate: validateAddress })}
        />
      </div>
      <div className="w-59">
        <UiInput
          label="Unit/Suite (Optional)"
          autoComplete="off"
          error={errors.unit?.message}
          {...register('unit')}
        />
      </div>
      <div className="w-59">
        <UiInput
          label="Zip code"
          autoComplete="off"
          inputMode="numeric"
          error={errors.zip?.message}
          {...register('zip', { validate: validateZip })}
        />
      </div>
      <div className="flex items-start gap-4">
        <div className="w-59 shrink-0">
          <UiInput
            label="City"
            autoComplete="off"
            error={errors.city?.message}
            {...register('city', { validate: validateCity })}
          />
        </div>
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
