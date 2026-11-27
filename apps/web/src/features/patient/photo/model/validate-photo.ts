export const MAX_PHOTO_SIZE = 5 * 1024 * 1024;
export const PHOTO_ACCEPT = 'image/jpeg,image/png,image/tiff';

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/tiff']);

/** Client-side check mirroring the API (JPG/PNG/TIFF, up to 5 MB). Returns an error message or `null`. */
export function validatePhotoFile(file: Pick<File, 'type' | 'size' | 'name'>) {
  // Some systems report TIFFs with an empty or `image/x-tiff` type: fall back to the extension.
  const isTiffByName = /\.tiff?$/i.test(file.name);
  const typeKnown = file.type !== '' && file.type !== 'image/x-tiff';
  if (typeKnown ? !ALLOWED_TYPES.has(file.type) : !isTiffByName) {
    return 'Photo must be a JPG, PNG or TIFF image.';
  }
  if (file.size > MAX_PHOTO_SIZE) {
    return 'Photo must be 5 MB or smaller.';
  }
  return null;
}

/** Maps a failed upload/delete to a message (`invalid-photo` 400, 413, anything else). */
export function getPhotoErrorMessage(error: unknown) {
  const response = (
    error as { response?: { status?: number; data?: { type?: string } } }
  ).response;
  if (response?.status === 413) return 'Photo must be 5 MB or smaller.';
  if (response?.data?.type === 'invalid-photo') {
    return 'Photo must be a JPG, PNG or TIFF image up to 5 MB.';
  }
  return 'Couldn’t update the photo. Try again.';
}
