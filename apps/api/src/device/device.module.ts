import { Module } from '@nestjs/common';
import { DeviceController } from './device.controller.js';
import { DeviceService } from './device.service.js';
import { DeviceModelController } from './device-model.controller.js';
import { DeviceModelService } from './device-model.service.js';
import { DbModule } from '../db/db.module.js';

@Module({
  imports: [DbModule],
  controllers: [DeviceController, DeviceModelController],
  providers: [DeviceService, DeviceModelService],
})
export class DeviceModule {}
