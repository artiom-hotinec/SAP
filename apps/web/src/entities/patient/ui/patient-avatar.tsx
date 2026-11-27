'use client';

import { useState } from 'react';
import type { PatientDto } from '@/shared/api';
import { getInitials } from '@/shared/lib';
import { UiAvatar } from '@/shared/ui/ui-avatar';
import {
  getPatientPhotoUrl,
  usePatientPhotoVersion,
} from '../api/patient-photo';

export interface PatientAvatarProps {
  patient: PatientDto;
}

/** Patient photo (`GET /patients/:id/photo`); falls back to initials when there is none (404). */
export function PatientAvatar({ patient }: PatientAvatarProps) {
  const version = usePatientPhotoVersion(patient.id);
  // Track which version failed, so a new upload (new version) retries the image.
  const [failedVersion, setFailedVersion] = useState<number | null>(null);

  if (failedVersion === version) {
    return (
      <UiAvatar size="lg" initials={getInitials(patient, patient.email)} />
    );
  }

  return (
    <img
      src={getPatientPhotoUrl(patient.id, version)}
      alt=""
      onError={() => setFailedVersion(version)}
      className="size-18.5 shrink-0 rounded-full border-2 border-blue-300 object-cover"
    />
  );
}
