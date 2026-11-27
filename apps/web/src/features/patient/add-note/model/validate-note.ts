import { MAX_NOTE_LENGTH } from '@/entities/patient-note';

/** Client-side check mirroring `CreatePatientNoteDto.body` (non-empty, up to 5000 chars). Returns an error message or `null`. */
export function validateNoteBody(value: string) {
  if (value.trim() === '') return 'Enter a note.';
  if (value.length > MAX_NOTE_LENGTH) {
    return `Note must be ${MAX_NOTE_LENGTH} characters or fewer.`;
  }
  return null;
}

/** Maps a failed add to a message (400 shows the server text when present). */
export function getAddNoteErrorMessage(error: unknown) {
  const response = (
    error as {
      response?: { status?: number; data?: { message?: string | string[] } };
    }
  ).response;
  const message = response?.data?.message;
  if (response?.status === 400 && message) {
    return Array.isArray(message) ? message.join(' ') : message;
  }
  return 'Couldn’t add the note. Try again.';
}
