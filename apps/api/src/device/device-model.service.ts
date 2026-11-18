import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DbService } from '../db/db.service.js';
import { AddDeviceModelItemDto, UpdateDeviceModelItemDto } from './dto.js';
import { Prisma } from '../generated/prisma/client.js';

@Injectable()
export class DeviceModelService {
  constructor(private db: DbService) {}

  async getDeviceModelByGtin(gtin: string) {
    const model = await this.db.deviceModel.findUnique({ where: { gtin } });

    if (!model) {
      throw new NotFoundException();
    }

    return model;
  }

  async createDeviceModel(dto: AddDeviceModelItemDto) {
    const { gtin, name } = dto;

    if (gtin && !/^\d{14}$/.test(gtin)) {
      throw new BadRequestException('gtin must be 14 digits');
    }

    try {
      return await this.db.deviceModel.create({
        data: { name: name.trim(), gtin: gtin ?? null },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException({ type: 'device-model-exists' });
      }
      throw error;
    }
  }

  async updateDeviceModel(id: string, dto: UpdateDeviceModelItemDto) {
    const model = await this.db.deviceModel.findUnique({ where: { id } });

    if (!model) {
      throw new NotFoundException();
    }

    if (
      dto.gtin !== undefined &&
      model.gtin !== null &&
      dto.gtin !== model.gtin
    ) {
      const devices = await this.db.device.count({
        where: { deviceModelId: id },
      });
      if (devices > 0) {
        throw new ConflictException({ type: 'device-model-in-use' });
      }
    }

    try {
      return await this.db.deviceModel.update({
        where: { id },
        data: { name: dto.name?.trim(), gtin: dto.gtin },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException({ type: 'device-model-exists' });
      }
      throw error;
    }
  }
}
