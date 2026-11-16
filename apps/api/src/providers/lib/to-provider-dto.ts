import { Prisma } from '../../generated/prisma/client.js';

export const providerInclude = {
  user: true,
  facility: true,
} satisfies Prisma.ProviderInclude;

type ProviderWithRelations = Prisma.ProviderGetPayload<{
  include: typeof providerInclude;
}>;

export function toProviderDto(provider: ProviderWithRelations) {
  return {
    id: provider.id,
    npi: provider.npi,
    phone: provider.phone,
    address: provider.address,
    dateHired: provider.dateHired,
    providerName:
      `${provider.user.firstName ?? ''} ${provider.user.lastName ?? ''}`.trim(),
    email: provider.user.email,
    firstName: provider.user.firstName,
    lastName: provider.user.lastName,
    facilityName: provider.facility.name,
  };
}
