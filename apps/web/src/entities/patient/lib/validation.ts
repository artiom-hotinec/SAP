import { US_STATES } from '@/shared/config';

/*
 * `validate` rules for react-hook-form: `true` when valid, otherwise the error
 * message. They mirror `CreatePatientDto` in the API. Optional fields (`unit`,
 * `dob`, `sex`, height, weight) are valid when empty.
 */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ZIP_PATTERN = /^\d{5}(-\d{4})?$/;

export const MIN_HEIGHT_IN = 12;
export const MAX_HEIGHT_IN = 108;
export const MIN_WEIGHT_LB = 1;
export const MAX_WEIGHT_LB = 1500;

function required(message: string) {
  return (value: string) => value.trim() !== '' || message;
}

export const validateFirstName = required('First name is required');
export const validateLastName = required('Last name is required');
export const validateAddress = required('Street address is required');
export const validateCity = required('City is required');

export function validateEmail(email: string) {
  const value = email.trim();

  if (!value) return 'Email is required';

  return EMAIL_PATTERN.test(value) || 'Invalid email format';
}

export function validatePhone(phone: string) {
  const digits = phone.replace(/\D/g, '');

  if (!digits) return 'Phone number is required';

  const valid =
    digits.length === 10 || (digits.length === 11 && digits.startsWith('1'));

  return valid || 'Invalid phone number';
}

export function validateZip(zip: string) {
  const value = zip.trim();

  if (!value) return 'Zip code is required';

  return ZIP_PATTERN.test(value) || 'Use 12345 or 12345-6789';
}

export function validateState(state: string) {
  return US_STATES.some((option) => option.value === state) || 'Select a state';
}

/** Total inches from typed feet and inches, or `null` if either isn't a whole number. */
export function toHeightIn(feet: string, inches: string): number | null {
  const f = feet.trim() === '' ? 0 : Number(feet);
  const i = inches.trim() === '' ? 0 : Number(inches);

  if (!Number.isInteger(f) || !Number.isInteger(i) || f < 0 || i < 0) {
    return null;
  }

  return f * 12 + i;
}

/** Splits total inches (as the API stores it) into feet and inches strings. */
export function fromHeightIn(heightIn: number | null | undefined) {
  if (heightIn == null) return { feet: '', inches: '' };

  return {
    feet: String(Math.floor(heightIn / 12)),
    inches: String(heightIn % 12),
  };
}

/** Feet and inches as typed; both empty means "not provided". */
export function validateHeight(feet: string, inches: string) {
  if (feet.trim() === '' && inches.trim() === '') return true;

  const total = toHeightIn(feet, inches);

  if (total === null) return 'Enter whole feet and inches';

  return (
    (total >= MIN_HEIGHT_IN && total <= MAX_HEIGHT_IN) ||
    'Height must be between 1 ft 0 in and 9 ft 0 in'
  );
}

export function validateWeight(weight: string) {
  const value = weight.trim();

  if (value === '') return true;

  const number = Number(value);

  if (!Number.isFinite(number)) return 'Enter a number';

  return (
    (number >= MIN_WEIGHT_LB && number <= MAX_WEIGHT_LB) ||
    `Weight must be between ${MIN_WEIGHT_LB} and ${MAX_WEIGHT_LB} lb`
  );
}
