'use client';

import { UiInput } from '@/shared/ui/ui-input';

export interface PatientHeightFieldProps {
  feet: string;
  inches: string;
  onFeetChange: (value: string) => void;
  onInchesChange: (value: string) => void;
  /** Validation message for the combined height. */
  error?: string;
}

/** Height as feet + inches inputs; use `toHeightIn` to get the inches the API takes. */
export function PatientHeightField({
  feet,
  inches,
  onFeetChange,
  onInchesChange,
  error,
}: PatientHeightFieldProps) {
  return (
    <div className="flex flex-col">
      <div className="flex items-start gap-4">
        <UiInput
          label="Height (ft)"
          inputMode="numeric"
          autoComplete="off"
          value={feet}
          aria-invalid={Boolean(error)}
          onChange={(event) => onFeetChange(event.target.value)}
        />
        <UiInput
          label="Height (in)"
          inputMode="numeric"
          autoComplete="off"
          value={inches}
          aria-invalid={Boolean(error)}
          onChange={(event) => onInchesChange(event.target.value)}
        />
      </div>
      {error && <p className="mt-1 text-body-sm text-red-400">{error}</p>}
    </div>
  );
}
