import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard.js';
import { ApiOkResponse, ApiResponse } from '@nestjs/swagger';
import {
  AddDeviceItemDto,
  DeviceDto,
  DeviceQueryDto,
  UpdateDeviceItemDto,
} from './dto.js';
import { DeviceService } from './device.service.js';

@Controller('device')
@UseGuards(AuthGuard)
export class DeviceController {
  constructor(private deviceService: DeviceService) {}

  @Get()
  @ApiResponse({
    type: DeviceDto,
    isArray: true,
  })
  getAllDevices(@Query() query: DeviceQueryDto): Promise<DeviceDto[]> {
    return this.deviceService.getAllDevices(query);
  }

  @Post()
  @ApiResponse({
    type: DeviceDto,
  })
  createDevice(@Body() body: AddDeviceItemDto): Promise<DeviceDto> {
    return this.deviceService.createDevice(body);
  }

  @Patch(':id')
  @ApiResponse({
    type: DeviceDto,
  })
  updateDevice(
    @Param('id') id: string,
    @Body() body: UpdateDeviceItemDto,
  ): Promise<DeviceDto> {
    return this.deviceService.updateDevice(id, body);
  }

  @Delete(':id')
  @ApiOkResponse({
    type: DeviceDto,
  })
  deleteDevice(@Param('id') id: string): Promise<DeviceDto> {
    return this.deviceService.deleteDevice(id);
  }
}
