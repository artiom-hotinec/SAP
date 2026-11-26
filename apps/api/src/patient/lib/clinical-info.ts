import { Prisma } from '../../generated/prisma/client.js';
import { toDate } from '../../common/date.helper.js';
import { CreatePatientDeviceDto } from '../dto/CreatePatientDeviceDto.js';
import { UpdatePatientClinicalInfoDto } from '../dto/UpdatePatientClinicalInfoDto.js';

type ClinicalInfoData = Prisma.PatientClinicalInfoCreateWithoutPatientInput;

type ClinicalInfoDates = Pick<
  ClinicalInfoData,
  'lastAppointment' | 'maskFittingDate' | 'sleepStudyDate'
>;

/** Date fields only for keys the request actually sent. */
export function datesFrom(
  ci: UpdatePatientClinicalInfoDto = {},
): ClinicalInfoDates {
  const out: ClinicalInfoDates = {};

  if (ci.lastAppointment !== undefined) {
    out.lastAppointment = toDate(ci.lastAppointment);
  }

  // Flag off -> clear its date. Otherwise only touch the date if one was sent.
  if (ci.maskFitting === false) out.maskFittingDate = null;
  else if (ci.maskFittingDate !== undefined) {
    out.maskFittingDate = toDate(ci.maskFittingDate);
  }

  if (ci.sleepStudy === false) out.sleepStudyDate = null;
  else if (ci.sleepStudyDate !== undefined) {
    out.sleepStudyDate = toDate(ci.sleepStudyDate);
  }

  return out;
}

/** The DTO sends one pressure; the schema stores a min-max range. */
export function pressureFrom(
  device: CreatePatientDeviceDto,
): Pick<ClinicalInfoData, 'prescribedPressureMin' | 'prescribedPressureMax'> {
  return {
    prescribedPressureMin: device.prescribedPressure,
    prescribedPressureMax: device.prescribedPressure,
  };
}

/** Whole clinical-info payload, shared by create and update. */
export function clinicalInfoData(
  ci: UpdatePatientClinicalInfoDto = {},
  device?: CreatePatientDeviceDto | null,
): ClinicalInfoData {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { lastAppointment, maskFittingDate, sleepStudyDate, ...flags } = ci;
  return { ...flags, ...datesFrom(ci), ...(device && pressureFrom(device)) };
}
