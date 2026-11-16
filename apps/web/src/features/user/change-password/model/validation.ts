export interface ChangePasswordValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export const MIN_PASSWORD_LENGTH = 8;

/** `validate` rules for react-hook-form: `true` when valid, otherwise the error message. */
export function validateCurrentPassword(password: string) {
  return password ? true : 'Current password is required';
}

export function validateNewPassword(
  password: string,
  values: ChangePasswordValues,
) {
  if (!password) {
    return 'New password is required';
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
  }

  return (
    password !== values.currentPassword ||
    'New password must be different from the current one'
  );
}

export function validateConfirmPassword(
  confirm: string,
  values: ChangePasswordValues,
) {
  if (!confirm) {
    return 'Please confirm the new password';
  }

  return confirm === values.newPassword || 'Passwords do not match';
}
