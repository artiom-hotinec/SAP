import { UiInput } from '@/shared/ui/ui-input';
import {
  validateContactEmail,
  validateContactName,
  validatePhone,
} from '../../model/validation';
import type { FacilityStepProps } from './types';

export function ContactStep({ form }: FacilityStepProps) {
  const {
    register,
    formState: { errors },
  } = form;

  return (
    <div className="flex flex-col gap-5">
      <div className="w-71.5">
        <UiInput
          label="Contact person (Admin)"
          autoComplete="off"
          error={errors.contactName?.message}
          {...register('contactName', { validate: validateContactName })}
        />
      </div>
      <div className="w-71.5">
        <UiInput
          label="Phone number"
          autoComplete="off"
          inputMode="tel"
          error={errors.phone?.message}
          {...register('phone', { validate: validatePhone })}
        />
      </div>
      <div className="w-71.5">
        <UiInput
          type="email"
          label="Email"
          autoComplete="off"
          error={errors.contactEmail?.message}
          {...register('contactEmail', { validate: validateContactEmail })}
        />
      </div>
    </div>
  );
}
