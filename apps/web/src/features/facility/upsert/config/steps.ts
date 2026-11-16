import type { FacilityFormValues } from '../model/form-values';

export type FacilityFormStep = 1 | 2 | 3;

export const FACILITY_FORM_STEPS = 3;

/** Fields validated before moving on from each step. */
export const STEP_FIELDS: Record<
  FacilityFormStep,
  (keyof FacilityFormValues)[]
> = {
  1: ['ein', 'permit', 'npi'],
  2: ['name', 'address', 'unit', 'zip', 'city', 'state'],
  3: ['contactName', 'phone', 'contactEmail'],
};
