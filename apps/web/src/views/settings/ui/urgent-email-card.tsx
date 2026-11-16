import { UiButton } from '@/shared/ui/ui-button';

/** Static for now: the button has no handler (the confirm flow isn't built). */
export function UrgentEmailCard() {
  return (
    <section className="flex h-18 items-center justify-between rounded-lg border border-grey-500 bg-white pr-6 pl-6">
      <p className="text-body-md font-light text-grey-700">
        Send an <strong className="font-bold text-red-brand">urgent</strong>{' '}
        email to all facilities?
      </p>
      <UiButton type="button" className="w-38.5 py-3.5">
        Send Email
      </UiButton>
    </section>
  );
}
