export interface SignInValues {
  email: string;
  password: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** `validate` rule for react-hook-form: `true` when valid, otherwise the error message. */
export function validateEmail(email: string) {
  if (!email) {
    return 'Email is required';
  }

  return EMAIL_PATTERN.test(email) || 'Invalid email format';
}

export function validatePassword(password: string) {
  return password ? true : 'Password is required';
}
