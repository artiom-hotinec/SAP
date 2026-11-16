import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DbService } from '../db/db.service.js';
import {
  AddFacilityItemDto,
  FacilitiesQueryDto,
  FacilitySortBy,
  UpdateFacilityItemDto,
} from './dto.js';
import { Prisma } from '../generated/prisma/client.js';

@Injectable()
export class FacilitiesService {
  constructor(private db: DbService) {}

  getFacilities(dto: FacilitiesQueryDto) {
    const { sortBy = FacilitySortBy.DATE_ADDED, q } = dto;

    const orderBy: Prisma.FacilityOrderByWithRelationInput =
      sortBy === FacilitySortBy.NAME ? { name: 'asc' } : { createdAt: 'desc' };

    return this.db.facility.findMany({
      where: {
        ...(q && {
          name: {
            contains: q,
            mode: 'insensitive',
          },
        }),
      },
      orderBy,
    });
  }

  async createFacility(data: AddFacilityItemDto) {
    try {
      return await this.db.facility.create({ data });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException({ type: 'ein-exists' });
      }
      throw error;
    }
  }

  async updateFacility(id: string, data: UpdateFacilityItemDto) {
    const facility = await this.db.facility.findUnique({ where: { id } });

    if (!facility) {
      throw new NotFoundException();
    }

    return this.db.facility.update({ where: { id }, data });
  }

  async deleteFacility(id: string) {
    const facility = await this.db.facility.findUnique({ where: { id } });

    if (!facility) {
      throw new NotFoundException();
    }

    return this.db.facility.delete({ where: { id } });
  }
}
