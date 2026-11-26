/**
 * Text fields are strings; optional ones (`dob`, `sex`, height, `weightLb`,
 * `unit`, `providerId`, dates and sleep-study numbers) may be empty. An empty
 * `providerId` means the signed-in provider. Step 5 adds its fields later.
 */
export interface PatientFormValues {
  firstName: string;
  lastName: string;
  dob: string;
  sex: string;
  heightFeet: string;
  heightInches: string;
  weightLb: string;
  email: string;
  phone: string;
  address: string;
  unit: string;
  zip: string;
  city: string;
  state: string;
  providerId: string;
  lastAppointment: string;
  maskFitting: boolean;
  maskFittingDate: string;
  sleepStudy: boolean;
  sleepStudyDate: string;
  atHomeStudy: boolean;
  sleepStudyBloodOxygenPct: string;
  sleepStudyHeartRateBpm: string;
  sleepStudySnoringHours: string;
}

export const EMPTY_PATIENT_VALUES: PatientFormValues = {
  firstName: '',
  lastName: '',
  dob: '',
  sex: '',
  heightFeet: '',
  heightInches: '',
  weightLb: '',
  email: '',
  phone: '',
  address: '',
  unit: '',
  zip: '',
  city: '',
  state: '',
  providerId: '',
  lastAppointment: '',
  maskFitting: false,
  maskFittingDate: '',
  sleepStudy: false,
  sleepStudyDate: '',
  atHomeStudy: false,
  sleepStudyBloodOxygenPct: '',
  sleepStudyHeartRateBpm: '',
  sleepStudySnoringHours: '',
};
