/**
 * All form fields are strings; optional ones (`dob`, `sex`, height, `weightLb`,
 * `unit`) may be empty. Steps 3-5 add their fields in later changes.
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
};
