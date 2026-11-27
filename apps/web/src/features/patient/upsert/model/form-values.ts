import { fromHeightIn, toHeightIn } from '@/entities/patient';
import type {
  CreatePatientDto,
  PatientDto,
  Sex,
  UpdatePatientDto,
} from '@/shared/api';

/**
 * `deviceId` value in the edit form meaning "leave the device as it is":
 * `PatientDto` doesn't expose the assigned device, so the form can't prefill it.
 */
export const KEEP_DEVICE = '__keep__';

/** True when `deviceId` names a device (not "none" and not "keep current"). */
export const hasDevice = (deviceId: string) =>
  deviceId !== '' && deviceId !== KEEP_DEVICE;

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
    device: !hasDevice(values.deviceId)
      ? undefined
      : {
          deviceId: values.deviceId,
          prescribedPressure: Number(values.prescribedPressure),
        },
  };
}

const toDay = (value: string | null) => (value ? value.slice(0, 10) : '');

/**
 * Edit-form starting values. `PatientDto` has no clinical-info or device data,
 * so those start blank (device: "keep current") and are sent only when changed.
 */
export function toFormValues(patient: PatientDto): PatientFormValues {
  const height = fromHeightIn(patient.heightIn);

  return {
    ...EMPTY_PATIENT_VALUES,
    firstName: patient.firstName,
    lastName: patient.lastName,
    dob: toDay(patient.dob),
    sex: patient.sex ?? '',
    heightFeet: height.feet,
    heightInches: height.inches,
    weightLb: patient.weightLb == null ? '' : String(patient.weightLb),
    email: patient.email,
    phone: patient.phone,
    address: patient.address ?? '',
    unit: patient.unit ?? '',
    zip: patient.zip ?? '',
    city: patient.city ?? '',
    state: patient.state ?? '',
    providerId: patient.providerId,
    lastAppointment: toDay(patient.lastAppointment),
    deviceId: KEEP_DEVICE,
  };
}

type ClinicalInfo = NonNullable<UpdatePatientDto['clinicalInfo']>;

/**
 * Builds the `PATCH /patients/:id` body: only what differs from `initial` is
 * sent. Device: omitted = unchanged, `null` = unassign, otherwise assign.
 */
export function toUpdateDto(
  values: PatientFormValues,
  initial: PatientFormValues,
): UpdatePatientDto {
  const full = toCreateDto(values);
  const was = toCreateDto(initial);
  const changed = (key: keyof PatientFormValues) =>
    values[key] !== initial[key];
  const dto: UpdatePatientDto = {};

  if (changed('firstName')) dto.firstName = full.firstName;
  if (changed('lastName')) dto.lastName = full.lastName;
  if (changed('dob') && full.dob !== undefined) dto.dob = full.dob;
  if (changed('sex') && full.sex !== undefined) dto.sex = full.sex;
  if (
    (changed('heightFeet') || changed('heightInches')) &&
    full.heightIn !== undefined
  ) {
    dto.heightIn = full.heightIn;
  }
  if (changed('weightLb') && full.weightLb !== undefined) {
    dto.weightLb = full.weightLb;
  }
  if (changed('email')) dto.email = full.email;
  if (changed('phone')) dto.phone = full.phone;
  if (changed('address')) dto.address = full.address;
  // An omitted `unit` keeps the old value, so a cleared one is sent as ''.
  if (changed('unit')) dto.unit = full.unit ?? '';
  if (changed('zip')) dto.zip = full.zip;
  if (changed('city')) dto.city = full.city;
  if (changed('state')) dto.state = full.state;
  if (changed('providerId') && full.providerId !== undefined) {
    dto.providerId = full.providerId;
  }

  const clinicalInfo: ClinicalInfo = {};
  const fullInfo = full.clinicalInfo;

  for (const key of Object.keys(fullInfo) as (keyof ClinicalInfo)[]) {
    if (fullInfo[key] === was.clinicalInfo[key]) continue;
    if (fullInfo[key] !== undefined) {
      (clinicalInfo as Record<string, unknown>)[key] = fullInfo[key];
    }
  }
  // A flag and its date go together: the API requires the date while the flag is on.
  if (
    values.maskFitting &&
    ('maskFitting' in clinicalInfo || 'maskFittingDate' in clinicalInfo)
  ) {
    clinicalInfo.maskFitting = true;
    clinicalInfo.maskFittingDate = fullInfo.maskFittingDate;
  }
  if (
    values.sleepStudy &&
    ('sleepStudy' in clinicalInfo || 'sleepStudyDate' in clinicalInfo)
  ) {
    clinicalInfo.sleepStudy = true;
    clinicalInfo.sleepStudyDate = fullInfo.sleepStudyDate;
  }
  if (Object.keys(clinicalInfo).length > 0) dto.clinicalInfo = clinicalInfo;

  if (values.deviceId === '') {
    dto.device = null;
  } else if (values.deviceId !== KEEP_DEVICE) {
    dto.device = full.device;
  }

  return dto;
}
