'use client';

import { useForm } from 'react-hook-form';
import { useChangePasswordMutation } from '@/entities/user';
import type { ErrorType } from '@/shared/api';
import { MIN_PASSWORD_LENGTH } from './validation';
import type { ChangePasswordValues } from './validation';

export const GENERIC_ERROR_MESSAGE = 'Something went wrong. Please try again.';
const WRONG_PASSWORD_MESSAGE = 'Current password is incorrect';

/** Nest error body: `message` is a string, or a list for DTO validation errors. */
function getServerMessage(error: ErrorType<unknown>) {
  const message = (error.response?.data as { message?: unknown } | undefined)
    ?.message;
  const text = Array.isArray(message) ? message.join('. ') : message;

  return typeof text === 'string' && text ? text : undefined;
}

export interface UseChangePasswordFormOptions {
  /** Called after the password was changed. */
  onSuccess: () => void;
}

export function useChangePasswordForm({
  onSuccess,
}: UseChangePasswordFormOptions) {
  const form = useForm<ChangePasswordValues>({
    mode: 'onChange',
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });
  const { setError, watch, handleSubmit } = form;

  const mutation = useChangePasswordMutation({
    onSuccess,
    onError: (error) => {
      const status = error.response?.status;
      if (status === 401) {
        setError('currentPassword', { message: WRONG_PASSWORD_MESSAGE });
      } else if (status === 400) {
        setError('newPassword', {
          message: getServerMessage(error) ?? GENERIC_ERROR_MESSAGE,
        });
      }
    },
  });

  const newPassword = watch('newPassword');
  const confirmPassword = watch('confirmPassword');

  const status = mutation.error?.response?.status;
  const serverError =
    mutation.error && status !== 400 && status !== 401
      ? GENERIC_ERROR_MESSAGE
      : undefined;

  const onSubmit = handleSubmit((values) =>
    mutation.mutate({
      oldPassword: values.currentPassword,
      newPassword: values.newPassword,
    }),
  );

  return {
    form,
    onSubmit,
    isPending: mutation.isPending,
    serverError,
    lengthValid: newPassword.length >= MIN_PASSWORD_LENGTH,
    matchValid: confirmPassword.length > 0 && confirmPassword === newPassword,
  };
}
