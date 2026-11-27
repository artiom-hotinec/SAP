'use client';

import { useRef } from 'react';
import { UiIconButton } from '@/shared/ui/ui-icon-button';
import { usePatientPhoto } from '../model/use-patient-photo';
import { PHOTO_ACCEPT } from '../model/validate-photo';

export interface PatientPhotoControlProps {
  patientId: string;
}

/** Upload/replace (pencil) and remove (trash) buttons for the patient photo, with error display. */
export function PatientPhotoControl({ patientId }: PatientPhotoControlProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { error, isPending, upload, remove } = usePatientPhoto(patientId);

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept={PHOTO_ACCEPT}
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (file) upload(file);
          }}
        />
        <UiIconButton
          icon="/icons/edit.svg"
          aria-label="Upload or replace photo"
          disabled={isPending}
          aria-busy={isPending || undefined}
          onClick={() => inputRef.current?.click()}
        />
        <UiIconButton
          icon="/icons/trash.svg"
          aria-label="Remove photo"
          disabled={isPending}
          onClick={remove}
        />
      </div>
      {error && (
        <p
          role="alert"
          className="max-w-40 text-center text-body-sm text-red-400"
        >
          {error}
        </p>
      )}
    </div>
  );
}
