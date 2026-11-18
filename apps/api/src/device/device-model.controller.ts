import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard.js';
import {
  AddDeviceModelItemDto,
  DeviceModelDto,
  UpdateDeviceModelItemDto,
} from './dto.js';
import { DeviceModelService } from './device-model.service.js';
import { GtinPipe } from './gtin.pipe.js';

@Controller('device-model')
@UseGuards(AuthGuard)
export class DeviceModelController {
  constructor(private deviceModelService: DeviceModelService) {}

  @Get(':gtin')
  @ApiResponse({
    type: DeviceModelDto,
  })
  getDeviceModelByGtin(
    @Param('gtin', GtinPipe) gtin: string,
  ): Promise<DeviceModelDto> {
    return this.deviceModelService.getDeviceModelByGtin(gtin);
  }

  @Post()
  @ApiResponse({
    type: DeviceModelDto,
  })
  createDeviceModel(
    @Body() body: AddDeviceModelItemDto,
  ): Promise<DeviceModelDto> {
    return this.deviceModelService.createDeviceModel(body);
  }

  @Patch(':id')
  @ApiResponse({
    type: DeviceModelDto,
  })
  updateDeviceModel(
    @Param('id') id: string,
    @Body() body: UpdateDeviceModelItemDto,
  ): Promise<DeviceModelDto> {
    return this.deviceModelService.updateDeviceModel(id, body);
  }
}
