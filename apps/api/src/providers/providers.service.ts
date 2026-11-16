import { Injectable, NotFoundException } from '@nestjs/common';
import { DbService } from '../db/db.service.js';
import { ProviderSortBy, ProvidersQueryDto } from './dto.js';
import { Prisma } from '../generated/prisma/client.js';
import { providerInclude, toProviderDto } from './lib/to-provider-dto.js';

@Injectable()
export class ProvidersService {
  constructor(private dbService: DbService) {}

  async getAllProviders(dto: ProvidersQueryDto) {
    const { sortBy, q } = dto;

    // providerName is firstName + lastName, so sort by both.
    const orderBy: Prisma.ProviderOrderByWithRelationInput[] =
      sortBy === ProviderSortBy.PROVIDER_NAME
        ? [{ user: { firstName: 'asc' } }, { user: { lastName: 'asc' } }]
        : sortBy === ProviderSortBy.FACILITY_NAME
          ? [{ facility: { name: 'asc' } }]
          : [{ createdAt: 'desc' }];

    const providers = await this.dbService.provider.findMany({
      where: {
        ...(q && {
          user: {
            is: {
              OR: [
                {
                  firstName: {
                    contains: q,
                    mode: 'insensitive',
                  },
                },
                {
                  lastName: {
                    contains: q,
                    mode: 'insensitive',
                  },
                },
              ],
            },
          },
        }),
      },
      orderBy,
      include: providerInclude,
    });

    return providers.map(toProviderDto);
  }

  async getProviderById(id: string) {
    const provider = await this.dbService.provider.findUnique({
      where: { id },
      include: providerInclude,
    });

    if (!provider) {
      throw new NotFoundException();
    }

    return toProviderDto(provider);
  }
}
