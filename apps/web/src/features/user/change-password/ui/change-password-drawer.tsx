'use client';

import { useId } from 'react';
import { UiButton } from '@/shared/ui/ui-button';
import { UiDrawer } from '@/shared/ui/ui-drawer';
import { UiInput } from '@/shared/ui/ui-input';
import { useChangePasswordForm } from '../model/use-change-password-form';
import {
  MIN_PASSWORD_LENGTH,
  validateConfirmPassword,
  validateCurrentPassword,
  validateNewPassword,
} from '../model/validation';

export interface ChangePasswordDrawerProps {
  open: boolean;
  onClose: () => void;
  /** Called after the password was changed. */
  onSuccess: () => void;
}

/** Mount it only while it is open, so every open starts with an empty form. */
export function ChangePasswordDrawer({
  open,
  onClose,
  onSuccess,
}: ChangePasswordDrawerProps) {
  const formId = useId();
  const { form, onSubmit, isPending, serverError, lengthValid, matchValid } =
    useChangePasswordForm({ onSuccess });
  const {
    register,
    formState: { errors },
  } = form;

  return (
    <UiDrawer
      open={open}
      title="Change Password"
      onClose={onClose}
      footer={
        <>
          {serverError && (
            <p role="alert" className="mb-3 text-body-sm text-red-400">
              {serverError}
            </p>
          )}
          <div className="flex items-center justify-end gap-10">
            <UiButton variant="cancel" onClick={onClose}>
              Cancel
            </UiButton>
            <UiButton
              type="submit"
              form={formId}
              className="w-32.5"
              disabled={isPending}
              aria-busy={isPending}
            >
              Save
            </UiButton>
          </div>
        </>
      }
    >
      <form id={formId} noValidate onSubmit={onSubmit}>
        <p className="text-body-lg text-grey-700">
          Create a strong and unique password to protect your account.
        </p>
        <div className="mt-6 flex flex-col gap-6">
          <UiInput
            type="password"
            size="sm"
            label="Current Password"
            autoComplete="current-password"
            error={errors.currentPassword?.message}
            {...register('currentPassword', {
              validate: validateCurrentPassword,
            })}
          />
          <UiInput
            type="password"
            size="sm"
            label="New Password"
            autoComplete="new-password"
            hint={`${MIN_PASSWORD_LENGTH} characters minimum`}
            hintValid={lengthValid}
            error={errors.newPassword?.message}
            {...register('newPassword', { validate: validateNewPassword })}
          />
          <UiInput
            type="password"
            size="sm"
            label="Confirm New Password"
            autoComplete="new-password"
            hint="Passwords match"
            hintValid={matchValid}
            error={errors.confirmPassword?.message}
            {...register('confirmPassword', {
              validate: validateConfirmPassword,
              deps: ['newPassword'],
            })}
          />
        </div>
      </form>
    </UiDrawer>
  );
}
