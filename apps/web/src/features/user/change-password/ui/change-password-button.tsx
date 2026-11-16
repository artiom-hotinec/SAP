'use client';

import Image from 'next/image';
import { useState } from 'react';
import { UiButton } from '@/shared/ui/ui-button';
import { UiModal } from '@/shared/ui/ui-modal';
import { ChangePasswordDrawer } from './change-password-drawer';

export function ChangePasswordButton() {
  const [open, setOpen] = useState(false);
  const [updated, setUpdated] = useState(false);

  return (
    <>
      <UiButton
        variant="link"
        aria-haspopup="dialog"
        className="gap-3 text-body-md"
        onClick={() => setOpen(true)}
      >
        Change password
        <Image src="/icons/edit.svg" alt="" width={24} height={24} />
      </UiButton>
      {open && (
        <ChangePasswordDrawer
          open
          onClose={() => setOpen(false)}
          onSuccess={() => {
            setOpen(false);
            setUpdated(true);
          }}
        />
      )}
      <UiModal
        open={updated}
        variant="single"
        title="Your password has been updated"
        onClose={() => setUpdated(false)}
      />
    </>
  );
}
