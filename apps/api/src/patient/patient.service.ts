import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { DbService } from '../db/db.service.js';
import {
  PatientFilterBy,
  PatientQueryDto,
  PatientSortBy,
} from './dto/PatientQueryDto.js';
import { Prisma } from '../generated/prisma/client.js';
import { CreatePatientDto } from './dto/CreatePatientDto.js';
import { activityFilter } from './lib/activity-filter.js';
import { patientInclude, toPatientDto } from './lib/to-patient-dto.js';
import { clinicalInfoData } from './lib/clinical-info.js';
import { toDate } from '../common/date.helper.js';
import { UpdatePatientDto } from './dto/UpdatePatientDto.js';
import { StorageService } from '../storage/storage.service.js';
import { normalizeAvatar } from './lib/avatar.js';
import { randomUUID } from 'node:crypto';

@Injectable()
export class PatientService {
  private readonly logger = new Logger(PatientService.name);

  constructor(
    private db: DbService,
    private storage: StorageService,
  ) {}

  private async getCaller(userId: string) {
    const provider = await this.db.provider.findFirst({
      where: { userId },
      select: { id: true, facilityId: true },
    });
    if (!provider) throw new ForbiddenException();
    return { providerId: provider.id, facilityId: provider.facilityId };
  }

  /**
   * Loads a patient the caller may access (same facility), or throws 404.
   * An unknown id and another facility's patient look the same on purpose.
   * Pass `select` / `include` to choose what is loaded.
   */
  private async findAccessible<A extends Prisma.PatientDefaultArgs>(
    me: { facilityId: string },
    patientId: string,
    args?: A,
  ): Promise<Prisma.PatientGetPayload<A>> {
    const patient = await this.db.patient.findFirst({
      ...args,
      where: { id: patientId, facilityId: me.facilityId },
    });
    if (!patient) throw new NotFoundException();
    return patient as Prisma.PatientGetPayload<A>;
  }

  async getAllPatients(userId: string, dto: PatientQueryDto) {
    const { q, sortBy, filterBy = [] } = dto;
    const me = await this.getCaller(userId);

    const where: Prisma.PatientWhereInput = {
      facilityId: me.facilityId,
      ...(q && {
        AND: q
          .trim()
          .split(/\s+/)
          .map((t) => ({
            OR: [
              { firstName: { contains: t, mode: 'insensitive' } },
              { lastName: { contains: t, mode: 'insensitive' } },
            ],
          })),
      }),
      ...(filterBy.includes(PatientFilterBy.MY_PATIENTS) && {
        providerId: me.providerId,
      }),
      ...activityFilter(filterBy),
    };

    const orderBy: Prisma.PatientOrderByWithRelationInput[] =
      sortBy === PatientSortBy.LAST_NAME
        ? [{ lastName: 'asc' }, { firstName: 'asc' }]
        : [{ createdAt: 'desc' }];

    const patients = await this.db.patient.findMany({
      where,
      orderBy,
      include: patientInclude,
    });

    return patients.map(toPatientDto);
  }

  async getPatient(userId: string, patientId: string) {
    const me = await this.getCaller(userId);

    const patient = await this.findAccessible(me, patientId, {
      include: patientInclude,
    });

    return toPatientDto(patient);
  }

  async createPatient(userId: string, dto: CreatePatientDto) {
    const me = await this.getCaller(userId);
    const { clinicalInfo: ci, device, providerId, dob, ...rest } = dto;

    const provider = providerId
      ? await this.db.provider.findFirst({
          where: { id: providerId, facilityId: me.facilityId },
          select: { id: true },
        })
      : { id: me.providerId };
    if (!provider) throw new NotFoundException({ type: 'provider-not-found' });

    try {
      return await this.db.$transaction(async (tx) => {
        // 2. Tell "unknown device" (404) apart from "unavailable" (409).
        if (device) {
          const found = await tx.device.findUnique({
            where: { deviceId: device.deviceId },
            select: { id: true },
          });
          if (!found) throw new NotFoundException({ type: 'device-not-found' });
        }

        // 3. Create the patient and clinical info.
        const patient = await tx.patient.create({
          data: {
            ...rest,
            dob: dob ? new Date(dob) : null,
            facility: { connect: { id: me.facilityId } },
            provider: { connect: { id: provider.id } },
            clinicalInfo: { create: clinicalInfoData(ci, device) },
          },
          include: patientInclude,
        });

        // 4. Claim the device atomically: the UPDATE locks the row, so a
        // concurrent request re-checks `patientId: null` and matches nothing.
        // Throwing rolls back the patient created above.
        if (device) {
          const claimed = await tx.device.updateMany({
            where: {
              deviceId: device.deviceId,
              patientId: null,
              OR: [{ facilityId: null }, { facilityId: me.facilityId }],
            },
            data: { patientId: patient.id },
          });
          if (claimed.count === 0) {
            throw new ConflictException({ type: 'device-unavailable' });
          }
        }

        return toPatientDto(patient);
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new ConflictException({ type: 'email-exists' });
      }
      throw e;
    }
  }

  async updatePatient(
    userId: string,
    patientId: string,
    dto: UpdatePatientDto,
  ) {
    const me = await this.getCaller(userId);
    const { clinicalInfo: ci, device, providerId, dob, ...rest } = dto;

    // 1. Same facility scope as getPatient (404 otherwise).
    const current = await this.findAccessible(me, patientId, {
      include: { devices: { select: { id: true, deviceId: true } } },
    });

    // 2. A new provider must belong to the caller's facility.
    if (providerId && providerId !== current.providerId) {
      const ok = await this.db.provider.findFirst({
        where: { id: providerId, facilityId: me.facilityId },
        select: { id: true },
      });
      if (!ok) throw new NotFoundException({ type: 'provider-not-found' });
    }

    try {
      return await this.db.$transaction(async (tx) => {
        // 3. Device: tri-state.
        if (device === null) {
          await tx.device.updateMany({
            where: { patientId },
            data: { patientId: null },
          });
        } else if (device && device.deviceId !== current.devices[0]?.deviceId) {
          const exists = await tx.device.findUnique({
            where: { deviceId: device.deviceId },
            select: { id: true },
          });
          if (!exists)
            throw new NotFoundException({ type: 'device-not-found' });

          await tx.device.updateMany({
            where: { patientId },
            data: { patientId: null },
          });
          const claimed = await tx.device.updateMany({
            where: {
              deviceId: device.deviceId,
              patientId: null,
              OR: [{ facilityId: null }, { facilityId: me.facilityId }],
            },
            data: { patientId },
          });
          if (claimed.count === 0) {
            throw new ConflictException({ type: 'device-unavailable' }); // rolls back the release too
          }
        }

        // 4. Patient + clinical info in one write.
        const patient = await tx.patient.update({
          where: { id: patientId },
          data: {
            ...rest,
            ...(dob !== undefined && { dob: toDate(dob) }),
            ...(providerId && { provider: { connect: { id: providerId } } }),
            ...((ci || device) && {
              clinicalInfo: {
                upsert: {
                  create: clinicalInfoData(ci, device),
                  update: clinicalInfoData(ci, device),
                },
              },
            }),
          },
          include: patientInclude,
        });
        return toPatientDto(patient);
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new ConflictException({ type: 'email-exists' });
      }
      throw e;
    }
  }

  async deletePatient(userId: string, patientId: string) {
    const me = await this.getCaller(userId);

    // 1. Same facility scope as the other endpoints; also collect the file keys.
    const patient = await this.findAccessible(me, patientId, {
      include: {
        ...patientInclude,
        documents: { select: { storageKey: true } },
      },
    });

    // 2. Delete the row. The cascades and the device release happen in the DB.
    try {
      await this.db.patient.delete({ where: { id: patientId } });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2025'
      ) {
        throw new NotFoundException(); // deleted by a concurrent request
      }
      throw e;
    }

    // 3. Files last, best effort: the data is already gone, so a failed file
    // delete must not turn a successful delete into a 500.
    const keys = [
      patient.avatar,
      ...patient.documents.map((d) => d.storageKey),
    ];
    await Promise.allSettled(
      keys.filter((k): k is string => !!k).map((k) => this.storage.delete(k)),
    );

    return toPatientDto(patient); // snapshot from before the delete
  }

  async addPhoto(
    userId: string,
    patientId: string,
    file?: Express.Multer.File,
  ) {
    const me = await this.getCaller(userId);

    // 1. Same facility scope as the other endpoints.
    const current = await this.findAccessible(me, patientId, {
      select: { avatar: true },
    });

    // 2. Validate and normalize: decode the real bytes, never trust the mimetype.
    const jpeg = await normalizeAvatar(file); // throws BadRequest({ type: 'invalid-photo' })

    // 3. Write the new file first, under a fresh key.
    const key = `patients/${patientId}/avatar/${randomUUID()}.jpg`;
    await this.storage.put(key, jpeg);

    // 4. Point the row at it; if that fails, remove the new file.
    let patient;
    try {
      patient = await this.db.patient.update({
        where: { id: patientId },
        data: { avatar: key },
        include: patientInclude,
      });
    } catch (e) {
      await this.storage.delete(key).catch(() => undefined);
      throw e;
    }

    // 5. Remove the old file last, best effort.
    if (current.avatar) {
      await this.storage.delete(current.avatar).catch(() => undefined);
    }

    return toPatientDto(patient);
  }

  async getPhoto(userId: string, patientId: string) {
    const me = await this.getCaller(userId);

    // Same facility scope as the other endpoints.
    const patient = await this.findAccessible(me, patientId, {
      select: { avatar: true },
    });
    if (!patient.avatar) throw new NotFoundException(); // no photo

    try {
      const stream = await this.storage.get(patient.avatar);
      return { key: patient.avatar, stream };
    } catch (err) {
      if (err instanceof NotFoundException) {
        // Row says there's a photo but the file is gone: DB and disk disagree.
        this.logger.error(
          `Missing avatar file for ${patientId}: ${patient.avatar}`,
        );
      }
      throw err;
    }
  }

  async deletePhoto(userId: string, patientId: string) {
    const me = await this.getCaller(userId);

    // 1. Same facility scope as the other endpoints.
    const current = await this.findAccessible(me, patientId, {
      select: { avatar: true },
    });
    if (!current.avatar) throw new NotFoundException(); // no photo

    // 2. Clear the pointer only if it still matches what we read.
    const { count } = await this.db.patient.updateMany({
      where: { id: patientId, avatar: current.avatar },
      data: { avatar: null },
    });
    if (count === 0) throw new NotFoundException(); // changed or deleted meanwhile

    // 3. File last, best effort: the row no longer references it.
    await this.storage
      .delete(current.avatar)
      .catch((e) =>
        this.logger.warn(`Orphaned avatar ${current.avatar}: ${e}`),
      );

    // 4. Return the updated patient.
    const patient = await this.db.patient.findUniqueOrThrow({
      where: { id: patientId },
      include: patientInclude,
    });

    return toPatientDto(patient);
  }
}
