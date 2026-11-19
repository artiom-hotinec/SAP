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

/** "Conejo Jones" → "Conejo" + "Jones"; a single word has no last name. */
function splitName(fullName: string) {
  const [firstName, ...rest] = fullName.trim().split(/\s+/);

  return { firstName, lastName: rest.length ? rest.join(' ') : null };
}

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

  /**
   * Creates the facility together with its admin: the contact person becomes
   * a Provider of the facility with a PORTAL_ADMIN user. One nested write, so
   * it is a single transaction.
   */
  async createFacility(facility: AddFacilityItemDto) {
    const { firstName, lastName } = splitName(facility.contactName);

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
              phone: facility.phone,
              address: facility.address,
              user: {
                create: {
                  email: facility.contactEmail,
                  firstName,
                  lastName,
                  phone: facility.phone,
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
