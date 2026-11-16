import type {
  AddFacilityItemDto,
  Facility,
  UpdateFacilityItemDto,
} from '@/shared/api';

/** All form fields are strings; optional ones (`permit`, `npi`, `unit`) may be empty. */
export interface FacilityFormValues {
  ein: string;
  permit: string;
  npi: string;
  name: string;
  address: string;
  unit: string;
  zip: string;
  city: string;
  state: string;
  contactName: string;
  phone: string;
  contactEmail: string;
}

export const EMPTY_FACILITY_VALUES: FacilityFormValues = {
  ein: '',
  permit: '',
  npi: '',
  name: '',
  address: '',
  unit: '',
  zip: '',
  city: '',
  state: '',
  contactName: '',
  phone: '',
  contactEmail: '',
};

export function toFormValues(facility: Facility): FacilityFormValues {
  return {
    ein: facility.ein,
    permit: facility.permit,
    npi: facility.npi,
    name: facility.name,
    address: facility.address,
    unit: facility.unit ?? '',
    zip: facility.zip,
    city: facility.city,
    state: facility.state,
    contactName: facility.contactName,
    phone: facility.phone,
    contactEmail: facility.contactEmail,
  };
}

function trimValues(values: FacilityFormValues): FacilityFormValues {
  return Object.fromEntries(
    Object.entries(values).map(([key, value]) => [key, value.trim()]),
  ) as unknown as FacilityFormValues;
}

/** `POST /facilities` body: everything trimmed, `unit` omitted when empty. */
export function toCreateDto(values: FacilityFormValues): AddFacilityItemDto {
  const { unit, ...rest } = trimValues(values);

  return unit ? { ...rest, unit } : rest;
}

/**
 * `PATCH /facilities/:id` body. The API can't change `ein`, `permit` or `npi`,
 * so they are left out. `unit` is sent as `''` when cleared, so clearing it
 * actually takes effect (an omitted field would keep the old value).
 */
export function toUpdateDto(values: FacilityFormValues): UpdateFacilityItemDto {
  const {
    name,
    address,
    unit,
    zip,
    city,
    state,
    contactName,
    phone,
    contactEmail,
  } = trimValues(values);

  return {
    name,
    address,
    unit,
    zip,
    city,
    state,
    contactName,
    phone,
    contactEmail,
  };
}
