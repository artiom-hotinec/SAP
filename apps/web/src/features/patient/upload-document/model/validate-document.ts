export const MAX_DOCUMENT_SIZE = 20 * 1024 * 1024;
export const DOCUMENT_ACCEPT = 'application/pdf,image/png,image/jpeg';

const ALLOWED_TYPES = new Set(['application/pdf', 'image/png', 'image/jpeg']);

/** Client-side check mirroring the API (PDF/PNG/JPEG, up to 20 MB). Returns an error message or `null`. */
export function validateDocumentFile(file: Pick<File, 'type' | 'size'>) {
  if (!ALLOWED_TYPES.has(file.type)) {
    return 'Document must be a PDF, PNG or JPEG file.';
  }
  if (file.size > MAX_DOCUMENT_SIZE) {
    return 'Document must be 20 MB or smaller.';
  }
  return null;
}

/** Maps a failed upload to a message (400 bad type/size, 413, anything else). */
export function getDocumentErrorMessage(error: unknown) {
  const status = (error as { response?: { status?: number } }).response?.status;
  if (status === 413) return 'Document must be 20 MB or smaller.';
  if (status === 400) {
    return 'Document must be a PDF, PNG or JPEG file up to 20 MB.';
  }
  return 'Couldn’t upload the document. Try again.';
}
