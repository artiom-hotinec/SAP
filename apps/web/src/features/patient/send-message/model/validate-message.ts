import { MAX_MESSAGE_LENGTH } from '@/entities/patient-message';

/** Client-side check mirroring `CreatePatientMessageDto.body` (non-empty, up to 2000 chars). Returns an error message or `null`. */
export function validateMessageBody(value: string) {
  if (value.trim() === '') return 'Enter a message.';
  if (value.length > MAX_MESSAGE_LENGTH) {
    return `Message must be ${MAX_MESSAGE_LENGTH} characters or fewer.`;
  }
  return null;
}

/** Maps a failed send to a message (400 shows the server text when present). */
export function getSendMessageErrorMessage(error: unknown) {
  const response = (
    error as {
      response?: { status?: number; data?: { message?: string | string[] } };
    }
  ).response;
  const message = response?.data?.message;
  if (response?.status === 400 && message) {
    return Array.isArray(message) ? message.join(' ') : message;
  }
  return 'Couldn’t send the message. Try again.';
}
