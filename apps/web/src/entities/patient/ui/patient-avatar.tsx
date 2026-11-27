'use client';

import { useState } from 'react';
import type { PatientDto } from '@/shared/api';
import { getInitials } from '@/shared/lib';
import { UiAvatar } from '@/shared/ui/ui-avatar';

export interface PatientAvatarProps {
  patient: PatientDto;
}

/** Patient photo (`GET /patients/:id/photo`); falls back to initials when there is none (404). */
export function PatientAvatar({ patient }: PatientAvatarProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <UiAvatar size="lg" initials={getInitials(patient, patient.email)} />
    );
  }

  return (
    <img
      src={`/api/patients/${patient.id}/photo`}
      alt=""
      onError={() => setFailed(true)}
      className="size-18.5 shrink-0 rounded-full border-2 border-blue-300 object-cover"
    />
  );
}
