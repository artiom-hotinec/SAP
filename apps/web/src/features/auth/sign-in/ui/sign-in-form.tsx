'use client';

import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { UiButton } from '@/shared/ui/ui-button';
import { UiInput } from '@/shared/ui/ui-input';
import { UiLink } from '@/shared/ui/ui-link';
import {
  GENERIC_ERROR_MESSAGE,
  INVALID_CREDENTIALS_MESSAGE,
  isInvalidCredentials,
  useSignIn,
} from '../model/use-sign-in';
import { validateEmail, validatePassword } from '../model/validation';
import type { SignInValues } from '../model/validation';

export interface SignInFormProps {
  /** Content rendered between the "Forgot Password" link and the submit button. */
  children?: ReactNode;
}

export function SignInForm({ children }: SignInFormProps) {
  const {
    register,
    handleSubmit,
    reset: resetForm,
    formState: { errors },
  } = useForm<SignInValues>({ defaultValues: { email: '', password: '' } });
  const { mutate, isPending, error, reset: resetMutation } = useSignIn();

  // With `cacheComponents` Next keeps this page alive (hidden) after navigating
  // away, so clear the fields and server error when it is hidden or unmounted.
  // Otherwise the previous credentials reappear after signing out.
  useEffect(
    () => () => {
      resetForm();
      resetMutation();
    },
    [resetForm, resetMutation],
  );

  const credentialsError = isInvalidCredentials(error)
    ? INVALID_CREDENTIALS_MESSAGE
    : undefined;
  const genericError =
    error && !credentialsError ? GENERIC_ERROR_MESSAGE : undefined;

  const onSubmit = handleSubmit((values) => mutate(values));

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-1 flex-col">
      <div className="flex flex-col gap-6">
        <UiInput
          type="email"
          label="Email"
          placeholder="Your email"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email', {
            setValueAs: (value: string) => value.trim(),
            validate: validateEmail,
            onChange: () => resetMutation(),
          })}
        />
        <UiInput
          type="password"
          label="Password"
          placeholder="Your password"
          autoComplete="current-password"
          error={errors.password?.message ?? credentialsError}
          {...register('password', {
            validate: validatePassword,
            onChange: () => resetMutation(),
          })}
        />
      </div>
      <UiLink href="#" className="mt-6 self-end">
        Forgot Password
      </UiLink>
      <div className="mt-10">{children}</div>
      <div className="mt-auto flex flex-col gap-3">
        {genericError && (
          <p role="alert" className="text-body-sm text-red-400">
            {genericError}
          </p>
        )}
        <UiButton type="submit" className="w-full" disabled={isPending}>
          Sign In
        </UiButton>
      </div>
    </form>
  );
}
