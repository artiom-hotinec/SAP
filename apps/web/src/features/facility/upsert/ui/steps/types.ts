import type { UseFormReturn } from 'react-hook-form';
import type { FacilityFormValues } from '../../model/form-values';

export interface FacilityStepProps {
  form: UseFormReturn<FacilityFormValues>;
}
