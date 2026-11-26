import type { PatientFormValues } from '../model/form-values';

export type PatientFormStep = 1 | 2 | 3 | 4 | 5;

export const PATIENT_FORM_STEPS = 5;

/** Fields validated before moving on from each step. */
export const STEP_FIELDS: Record<PatientFormStep, (keyof PatientFormValues)[]> =
  {
    1: [
      'firstName',
      'lastName',
      'dob',
      'heightFeet',
      'heightInches',
      'weightLb',
      'email',
      'phone',
    ],
    2: ['address', 'unit', 'zip', 'city', 'state'],
    3: ['providerId', 'lastAppointment', 'maskFittingDate'],
    4: [
      'sleepStudyDate',
      'sleepStudyBloodOxygenPct',
      'sleepStudyHeartRateBpm',
      'sleepStudySnoringHours',
    ],
    5: [],
  };
