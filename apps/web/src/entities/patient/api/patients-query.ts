import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { patientControllerGetAllPatients } from '@/shared/api';
import type {
  ErrorType,
  PatientControllerGetAllPatientsParams,
  PatientDto,
} from '@/shared/api';

export const patientsQueryKey = ['patients'] as const;

/** `q`, `sortBy` and `filterBy` go straight to `GET /patients`. */
export function usePatientsQuery(
  params: PatientControllerGetAllPatientsParams = {},
) {
  return useQuery<PatientDto[], ErrorType<unknown>>({
    queryKey: [...patientsQueryKey, 'list', params],
    queryFn: ({ signal }) =>
      patientControllerGetAllPatients(params, { signal }),
    placeholderData: keepPreviousData,
  });
}
