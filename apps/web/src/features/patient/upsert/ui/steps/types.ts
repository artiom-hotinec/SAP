import type { UseFormReturn } from 'react-hook-form';
import type { PatientFormValues } from '../../model/form-values';

export interface PatientStepProps {
  form: UseFormReturn<PatientFormValues>;
}
