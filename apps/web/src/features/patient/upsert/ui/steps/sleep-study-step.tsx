import { useWatch } from 'react-hook-form';
import { UiCheckbox } from '@/shared/ui/ui-checkbox';
import { UiInput } from '@/shared/ui/ui-input';
import {
  validateDateWhen,
  validateNumberInRange,
} from '../../model/validation';
import type { PatientStepProps } from './types';

export function SleepStudyStep({ form }: PatientStepProps) {
  const {
    register,
    control,
    getValues,
    setValue,
    clearErrors,
    formState: { errors },
  } = form;
  const sleepStudy = useWatch({ control, name: 'sleepStudy' });

  return (
    <div className="flex flex-col gap-5">
      <UiCheckbox
        label="Sleep study"
        {...register('sleepStudy', {
          onChange: (event) => {
            if (!event.target.checked) setValue('sleepStudyDate', '');
            clearErrors('sleepStudyDate');
          },
        })}
      />
      {sleepStudy && (
        <UiInput
          label="Sleep study date"
          placeholder="YYYY-MM-DD"
          autoComplete="off"
          error={errors.sleepStudyDate?.message}
          {...register('sleepStudyDate', {
            validate: (value) =>
              validateDateWhen(getValues('sleepStudy'), value),
          })}
        />
      )}
      <UiCheckbox label="At-home study" {...register('atHomeStudy')} />
      <div className="flex items-start gap-4">
        <UiInput
          label="Blood oxygen % (Optional)"
          inputMode="decimal"
          autoComplete="off"
          error={errors.sleepStudyBloodOxygenPct?.message}
          {...register('sleepStudyBloodOxygenPct', {
            validate: (value) =>
              validateNumberInRange(value, { min: 0, max: 100 }),
          })}
        />
        <UiInput
          label="Heart rate, bpm (Optional)"
          inputMode="numeric"
          autoComplete="off"
          error={errors.sleepStudyHeartRateBpm?.message}
          {...register('sleepStudyHeartRateBpm', {
            validate: (value) =>
              validateNumberInRange(value, { min: 0, max: 300, integer: true }),
          })}
        />
      </div>
      <UiInput
        label="Snoring hours (Optional)"
        inputMode="decimal"
        autoComplete="off"
        error={errors.sleepStudySnoringHours?.message}
        {...register('sleepStudySnoringHours', {
          validate: (value) =>
            validateNumberInRange(value, { min: 0, max: 24 }),
        })}
      />
    </div>
  );
}
