import { useQuery } from '@tanstack/react-query';
import { patientControllerGetPatient } from '@/shared/api';
import type { ErrorType, PatientDto } from '@/shared/api';
import { patientsQueryKey } from './patients-query';

export function usePatientQuery(id: string) {
  return useQuery<PatientDto, ErrorType<unknown>>({
    queryKey: [...patientsQueryKey, 'detail', id],
    queryFn: ({ signal }) => patientControllerGetPatient(id, { signal }),
    // An unknown id won't appear on retry; show "not found" right away.
    retry: (failureCount, error) =>
      error.response?.status !== 404 && failureCount < 3,
  });
}
