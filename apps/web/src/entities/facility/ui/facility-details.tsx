import clsx from 'clsx';
import type { HTMLAttributes, ReactNode } from 'react';
import type { Facility } from '@/shared/api';
import { UiReadonlyField } from '@/shared/ui/ui-readonly-field';

export interface FacilityDetailsProps extends HTMLAttributes<HTMLElement> {
  facility: Facility;
  /** Controls shown next to the title (e.g. edit / delete buttons). */
  actions?: ReactNode;
}

const FIELD = 'w-full max-w-37.5';

export function FacilityDetails({
  facility,
  actions,
  className,
  ...props
}: FacilityDetailsProps) {
  const titleId = `facility-details-${facility.id}`;

  return (
    <section
      aria-labelledby={titleId}
      className={clsx('border-t border-grey-500 px-6 pt-4.5 pb-6', className)}
      {...props}
    >
      <div className="flex items-center justify-between gap-6">
        <h2 id={titleId} className="text-body-md font-bold text-grey-700">
          Healthcare Facility Information
        </h2>
        {actions && <div className="flex items-center gap-6">{actions}</div>}
      </div>

      <div className="mt-10 grid grid-cols-2 gap-x-8 lg:grid-cols-[repeat(4,150px)] lg:gap-x-25.5 gap-y-5.75">
        <UiReadonlyField
          className={FIELD}
          label="Facility Name"
          value={facility.name}
        />
        <UiReadonlyField className={FIELD} label="EIN #" value={facility.ein} />
        <UiReadonlyField className={FIELD} label="NPI" value={facility.npi} />
        <UiReadonlyField
          className={FIELD}
          label="Seller’s Permit #"
          value={facility.permit}
        />

        <UiReadonlyField
          className="col-span-2"
          label="Address"
          value={facility.address}
        />
        <UiReadonlyField
          className={FIELD}
          label="Unit/Suite"
          value={facility.unit || '--'}
        />
        <UiReadonlyField className={FIELD} label="City" value={facility.city} />

        <UiReadonlyField
          className={FIELD}
          label="State"
          value={facility.state}
        />
        <UiReadonlyField
          className={FIELD}
          label="Zip code"
          value={facility.zip}
        />

        <UiReadonlyField
          className={clsx(FIELD, 'col-start-1')}
          label="Contact Person (Admin)"
          value={facility.contactName}
        />
        <UiReadonlyField
          className={FIELD}
          label="Phone Number"
          value={facility.phone}
        />
        <UiReadonlyField
          className={FIELD}
          label="Email"
          value={
            <a
              href={`mailto:${facility.contactEmail}`}
              className="hover:underline focus-visible:underline focus-visible:outline-none"
            >
              {facility.contactEmail}
            </a>
          }
        />
      </div>
    </section>
  );
}
