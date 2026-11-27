import { Controller, useWatch } from 'react-hook-form';
import { useProvidersQuery } from '@/entities/provider';
import { UiCheckbox } from '@/shared/ui/ui-checkbox';
import { UiDropdown } from '@/shared/ui/ui-dropdown';
import { UiInput } from '@/shared/ui/ui-input';
import { validateDateWhen, validateOptionalDate } from '../../model/validation';
import type { PatientStepProps } from './types';

export function ProviderStep({ form }: PatientStepProps) {
  const {
    register,
    control,
    getValues,
    setValue,
    clearErrors,
    formState: { errors },
  } = form;
  const maskFitting = useWatch({ control, name: 'maskFitting' });
  const { data: providers = [] } = useProvidersQuery();

  const options = [
    { value: '', label: 'Me (signed-in provider)' },
    ...providers.map((provider) => ({
      value: provider.id,
      label: provider.providerName,
    })),
  ];

  return (
    <div className="flex flex-col gap-5">
      <Controller
        control={control}
        name="providerId"
        render={({ field }) => (
          <UiDropdown
            label="Provider"
            options={options}
            value={field.value}
            onChange={field.onChange}
          />
        )}
      />
      <UiInput
        label="Last appointment (Optional)"
        placeholder="YYYY-MM-DD"
        autoComplete="off"
        error={errors.lastAppointment?.message}
        {...register('lastAppointment', { validate: validateOptionalDate })}
      />
      <UiCheckbox
        label="Mask fitting"
        {...register('maskFitting', {
          onChange: (event) => {
            if (!event.target.checked) setValue('maskFittingDate', '');
            clearErrors('maskFittingDate');
          },
        })}
      />
      {maskFitting && (
        <UiInput
          label="Mask fitting date"
          placeholder="YYYY-MM-DD"
          autoComplete="off"
          error={errors.maskFittingDate?.message}
          {...register('maskFittingDate', {
            validate: (value) =>
              validateDateWhen(getValues('maskFitting'), value),
          })}
        />
      )}
    </div>
  );
}
