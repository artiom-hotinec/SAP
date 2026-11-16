import { UiInput } from '@/shared/ui/ui-input';
import { validateEin } from '../../model/validation';
import type { FacilityStepProps } from './types';

export function IdentifiersStep({ form }: FacilityStepProps) {
  const {
    register,
    formState: { errors },
  } = form;

  return (
    <div className="flex flex-col gap-5">
      <div className="w-71.5">
        <UiInput
          label="EIN #"
          autoComplete="off"
          error={errors.ein?.message}
          {...register('ein', { validate: validateEin })}
        />
      </div>
      <div className="w-71.5">
        <UiInput
          label="Seller’s permit # (if applicable)"
          autoComplete="off"
          error={errors.permit?.message}
          {...register('permit')}
        />
      </div>
      <div className="w-71.5">
        <UiInput
          label="NPI (if applicable)"
          autoComplete="off"
          error={errors.npi?.message}
          {...register('npi')}
        />
      </div>
    </div>
  );
}
