import { Controller, useWatch } from 'react-hook-form';
import {
  PatientHeightField,
  validateEmail,
  validateFirstName,
  validateHeight,
  validateLastName,
  validatePhone,
  validateWeight,
} from '@/entities/patient';
import { Sex } from '@/shared/api';
import { UiDropdown } from '@/shared/ui/ui-dropdown';
import { UiInput } from '@/shared/ui/ui-input';
import { validateDob } from '../../model/validation';
import type { PatientStepProps } from './types';

const SEX_OPTIONS = [
  { value: Sex.FEMALE, label: 'Female' },
  { value: Sex.MALE, label: 'Male' },
  { value: Sex.OTHER, label: 'Other' },
];

export function PersonalInfoStep({ form }: PatientStepProps) {
  const {
    register,
    control,
    getValues,
    setValue,
    trigger,
    formState: { errors },
  } = form;
  const [feet, inches] = useWatch({
    control,
    name: ['heightFeet', 'heightInches'],
  });

  // Height is two inputs but one rule: the error lives on `heightFeet`.
  register('heightFeet', {
    validate: () =>
      validateHeight(getValues('heightFeet'), getValues('heightInches')),
  });
  register('heightInches');

  const setHeight = (field: 'heightFeet' | 'heightInches', value: string) => {
    setValue(field, value);
    void trigger('heightFeet');
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start gap-4">
        <UiInput
          label="First name"
          autoComplete="off"
          error={errors.firstName?.message}
          {...register('firstName', { validate: validateFirstName })}
        />
        <UiInput
          label="Last name"
          autoComplete="off"
          error={errors.lastName?.message}
          {...register('lastName', { validate: validateLastName })}
        />
      </div>
      <div className="flex items-start gap-4">
        <UiInput
          label="Date of birth (Optional)"
          placeholder="YYYY-MM-DD"
          autoComplete="off"
          error={errors.dob?.message}
          {...register('dob', { validate: (value) => validateDob(value) })}
        />
        <div className="min-w-0 flex-1">
          <Controller
            control={control}
            name="sex"
            render={({ field }) => (
              <UiDropdown
                label="Sex (Optional)"
                placeholder="Select"
                options={SEX_OPTIONS}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
        </div>
      </div>
      <div className="flex items-start gap-4">
        <PatientHeightField
          feet={feet}
          inches={inches}
          onFeetChange={(value) => setHeight('heightFeet', value)}
          onInchesChange={(value) => setHeight('heightInches', value)}
          error={errors.heightFeet?.message}
        />
        <UiInput
          label="Weight (lb)"
          inputMode="numeric"
          autoComplete="off"
          error={errors.weightLb?.message}
          {...register('weightLb', { validate: validateWeight })}
        />
      </div>
      <UiInput
        label="Email"
        type="email"
        autoComplete="off"
        error={errors.email?.message}
        {...register('email', { validate: validateEmail })}
      />
      <UiInput
        label="Phone"
        autoComplete="off"
        inputMode="tel"
        error={errors.phone?.message}
        {...register('phone', { validate: validatePhone })}
      />
    </div>
  );
}
