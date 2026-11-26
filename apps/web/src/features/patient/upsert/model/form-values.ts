import { toHeightIn } from '@/entities/patient';
import type { CreatePatientDto, Sex } from '@/shared/api';

/**
 * Text fields are strings; optional ones (`dob`, `sex`, height, `weightLb`,
 * `unit`, `providerId`, dates and sleep-study numbers) may be empty. An empty
 * `providerId` means the signed-in provider; an empty `deviceId` means no device.
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
  deviceId: string;
  prescribedPressure: string;
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
  deviceId: '',
  prescribedPressure: '',
};

export const MIN_PRESSURE = 4;
export const MAX_PRESSURE = 20;

const optional = (value: string) => {
  const text = value.trim();

  return text === '' ? undefined : text;
};

const optionalNumber = (value: string) => {
  const text = optional(value);

  return text === undefined ? undefined : Number(text);
};

/** Builds the `POST /patients` body; empty optional fields are omitted. */
export function toCreateDto(values: PatientFormValues): CreatePatientDto {
  const hasHeight =
    values.heightFeet.trim() !== '' || values.heightInches.trim() !== '';

  return {
    firstName: values.firstName.trim(),
    lastName: values.lastName.trim(),
    dob: optional(values.dob),
    sex: values.sex === '' ? undefined : (values.sex as Sex),
    heightIn: hasHeight
      ? (toHeightIn(values.heightFeet, values.heightInches) ?? undefined)
      : undefined,
    weightLb: optionalNumber(values.weightLb),
    email: values.email.trim(),
    phone: values.phone.trim(),
    address: values.address.trim(),
    unit: optional(values.unit),
    zip: values.zip.trim(),
    city: values.city.trim(),
    state: values.state,
    providerId: values.providerId === '' ? undefined : values.providerId,
    clinicalInfo: {
      lastAppointment: optional(values.lastAppointment),
      maskFitting: values.maskFitting,
      maskFittingDate: values.maskFitting
        ? optional(values.maskFittingDate)
        : undefined,
      sleepStudy: values.sleepStudy,
      sleepStudyDate: values.sleepStudy
        ? optional(values.sleepStudyDate)
        : undefined,
      atHomeStudy: values.atHomeStudy,
      sleepStudyBloodOxygenPct: optionalNumber(values.sleepStudyBloodOxygenPct),
      sleepStudyHeartRateBpm: optionalNumber(values.sleepStudyHeartRateBpm),
      sleepStudySnoringHours: optionalNumber(values.sleepStudySnoringHours),
    },
    device:
      values.deviceId === ''
        ? undefined
        : {
            deviceId: values.deviceId,
            prescribedPressure: Number(values.prescribedPressure),
          },
  };
}
