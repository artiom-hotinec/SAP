import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DbService } from '../db/db.service.js';
import {
  AddDeviceItemDto,
  DeviceQueryDto,
  DeviceSortBy,
  UpdateDeviceItemDto,
} from './dto.js';
import { Prisma } from '../generated/prisma/client.js';
import { DeviceIdParseError, parseDeviceId } from './device-id.parser.js';
import { deviceInclude, toDeviceDto } from './device.mapper.js';

@Injectable()
export class DeviceService {
  constructor(private db: DbService) {}

  private parse(deviceId: string) {
    try {
      return parseDeviceId(deviceId);
    } catch (error) {
      if (error instanceof DeviceIdParseError) {
        throw new BadRequestException({
          type: 'invalid-device-id',
          reason: error.reason,
        });
      }
      throw error;
    }
  }

  private async getModelByGtin(gtin: string) {
    const model = await this.db.deviceModel.findUnique({ where: { gtin } });
    if (!model) {
      throw new BadRequestException({ type: 'unknown-device-model' });
    }
    return model;
  }

  private async getActiveFacility(id: string) {
    const facility = await this.db.facility.findUnique({ where: { id } });
    if (!facility) {
      throw new NotFoundException();
    }
    if (!facility.active) {
      throw new BadRequestException({ type: 'facility-inactive' });
    }
    return facility;
  }

  async getAllDevices(dto: DeviceQueryDto) {
    const { sortBy = DeviceSortBy.DATE_ADDED, q } = dto;

    const orderBy: Prisma.DeviceOrderByWithRelationInput[] =
      sortBy === DeviceSortBy.MODEL
        ? [{ deviceModel: { name: 'asc' } }, { createdAt: 'desc' }]
        : [{ createdAt: 'desc' }];

    const devices = await this.db.device.findMany({
      where: q ? { deviceId: { contains: q, mode: 'insensitive' } } : undefined,
      include: deviceInclude,
      orderBy,
    });

    return devices.map((device) => ({
      id: device.id,
      deviceId: device.deviceId,
      modelName: device.deviceModel.name,
      facilityName: device.facility?.name ?? null,
      manufactureDate: device.manufactureDate,
      lastConnectedAt: device.lastConnectedAt,
    }));
  }

  async createDevice(dto: AddDeviceItemDto) {
    const parsed = this.parse(dto.deviceId);

    const model = await this.getModelByGtin(parsed.gtin);

    const facilityId = dto.facilityId
      ? (await this.getActiveFacility(dto.facilityId)).id
      : null;

    try {
      const device = await this.db.device.create({
        data: {
          deviceId: parsed.canonical,
          manufactureDate: parsed.productionDate,
          deviceModelId: model.id,
          facilityId,
        },
        include: deviceInclude,
      });

      return toDeviceDto(device);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException({ type: 'device-exists' });
      }
      throw error;
    }
  }

  async updateDevice(id: string, dto: UpdateDeviceItemDto) {
    const existing = await this.db.device.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException();
    }

    const parsed = this.parse(dto.deviceId);
    const model = await this.getModelByGtin(parsed.gtin);
    const facilityId = dto.facilityId
      ? (await this.getActiveFacility(dto.facilityId)).id
      : null;

    try {
      const device = await this.db.device.update({
        where: { id },
        data: {
          deviceId: parsed.canonical,
          manufactureDate: parsed.productionDate,
          deviceModelId: model.id,
          facilityId,
        },
        include: deviceInclude,
      });

      return toDeviceDto(device);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException({ type: 'device-exists' });
      }
      throw error;
    }
  }
}
