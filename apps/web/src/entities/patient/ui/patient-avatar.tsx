'use client';

import clsx from 'clsx';
import { useState } from 'react';
import type { PatientDto } from '@/shared/api';
import { getInitials } from '@/shared/lib';
import { UiAvatar } from '@/shared/ui/ui-avatar';
import type { UiAvatarSize } from '@/shared/ui/ui-avatar';
import {
  getPatientPhotoUrl,
  usePatientPhotoVersion,
} from '../api/patient-photo';

export interface PatientAvatarProps {
  patient: PatientDto;
  /** `sm` for list rows, `lg` (default) for the profile card. */
  size?: UiAvatarSize;
}

/** Patient photo (`GET /patients/:id/photo`); falls back to initials when there is none (404). */
export function PatientAvatar({ patient, size = 'lg' }: PatientAvatarProps) {
  const version = usePatientPhotoVersion(patient.id);
  // Track which version failed, so a new upload (new version) retries the image.
  const [failedVersion, setFailedVersion] = useState<number | null>(null);

  if (failedVersion === version) {
    return (
      <UiAvatar size={size} initials={getInitials(patient, patient.email)} />
    );
  }

  return (
    <img
      src={getPatientPhotoUrl(patient.id, version)}
      alt=""
      loading={size === 'sm' ? 'lazy' : undefined}
      onError={() => setFailedVersion(version)}
      className={clsx(
        'shrink-0 rounded-full object-cover',
        size === 'sm' ? 'size-8' : 'size-18.5 border-2 border-blue-300',
      )}
    />
  );
}
