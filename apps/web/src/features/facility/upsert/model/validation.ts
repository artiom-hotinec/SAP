import { US_STATES } from '@/shared/config';

/*
 * `validate` rules for react-hook-form: `true` when valid, otherwise the error
 * message. Optional fields (`permit`, `npi`, `unit`) have no rule.
 */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ZIP_PATTERN = /^\d{5}$/;

function required(message: string) {
  return (value: string) => value.trim() !== '' || message;
}

export const validateEin = required('EIN is required');
export const validateName = required('Facility name is required');
export const validateAddress = required('Street address is required');
export const validateCity = required('City is required');
export const validateContactName = required('Contact person is required');

export function validateState(state: string) {
  return US_STATES.some((option) => option.value === state) || 'Select a state';
}

export function validateZip(zip: string) {
  const value = zip.trim();

  if (!value) {
    return 'Zip code is required';
  }

  return ZIP_PATTERN.test(value) || 'Zip code must be 5 digits';
}

export function validatePhone(phone: string) {
  const digits = phone.replace(/\D/g, '');

  if (!digits) {
    return 'Phone number is required';
  }

  const valid =
    digits.length === 10 || (digits.length === 11 && digits.startsWith('1'));

  return valid || 'Invalid phone number';
}

export function validateContactEmail(email: string) {
  const value = email.trim();

  if (!value) {
    return 'Email is required';
  }

  return EMAIL_PATTERN.test(value) || 'Invalid email format';
}
