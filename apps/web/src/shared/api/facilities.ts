import type { AxiosRequestConfig } from 'axios';
import { createInstance } from './api-instance';
import type { FacilityDto } from './generated';

/*
 * Hand-written stand-in for the generated `GET /facilities` client.
 * The API's OpenAPI schema currently describes the response as a single
 * `FacilityDto`, omits the `sortBy` query param and types `unit` as an object.
 * Once the schema is fixed, regenerate the client and switch back to
 * `facilitiesControllerGetFacilities` / `FacilityDto`.
 */

export const FacilitySortBy = {
  name: 'name',
  dateAdded: 'dateAdded',
} as const;

export type FacilitySortBy =
  (typeof FacilitySortBy)[keyof typeof FacilitySortBy];

export interface GetFacilitiesParams {
  q?: string;
  sortBy?: FacilitySortBy;
}

export type Facility = Omit<FacilityDto, 'unit'> & { unit?: string | null };

export const getFacilities = (
  params?: GetFacilitiesParams,
  options?: AxiosRequestConfig,
) =>
  createInstance<Facility[]>(
    { url: '/facilities', method: 'GET', params },
    options,
  );
