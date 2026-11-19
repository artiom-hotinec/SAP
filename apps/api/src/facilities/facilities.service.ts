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
import { Prisma, UserRole } from '../generated/prisma/client.js';
import { PasswordService } from '../password/password.service.js';

@Injectable()
export class FacilitiesService {
  constructor(
    private db: DbService,
    private passwordService: PasswordService,
  ) {}

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

  async createFacility({ admin, ...facility }: AddFacilityItemDto) {
    const { user, ...provider } = admin;

    const salt = this.passwordService.getSalt();
    const passwordHash = this.passwordService.getHash(
      this.passwordService.getSalt(32),
      salt,
    );

    try {
      return await this.db.facility.create({
        data: {
          ...facility,
          providers: {
            create: {
              ...provider,
              user: {
                create: {
                  ...user,
                  role: UserRole.PORTAL_ADMIN,
                  salt,
                  passwordHash,
                  resetToken: this.passwordService.getSalt(32),
                  resetTokenExpiresAt: new Date(
                    Date.now() + 7 * 24 * 60 * 60 * 1000,
                  ),
                },
              },
            },
          },
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        // With the pg driver adapter, P2002 has no `meta.target`; the table
        // is on the adapter error's cause.
        const { driverAdapterError } = (error.meta ?? {}) as {
          driverAdapterError?: { cause?: { table?: string } };
        };
        const table = driverAdapterError?.cause?.table;

        if (table === 'User') {
          throw new ConflictException({ type: 'email-exists' });
        }
        if (table === 'Provider') {
          throw new ConflictException({ type: 'npi-exists' });
        }
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
