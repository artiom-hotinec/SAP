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
import { FacilitiesService } from './facilities.service.js';
import { ApiCreatedResponse, ApiResponse } from '@nestjs/swagger';
import {
  AddFacilityItemDto,
  FacilitiesQueryDto,
  FacilityDto,
  UpdateFacilityItemDto,
} from './dto.js';
import { AuthGuard } from '../auth/auth.guard.js';

@Controller('facilities')
@UseGuards(AuthGuard)
export class FacilitiesController {
  constructor(private facilitiesService: FacilitiesService) {}

  @Get()
  @ApiResponse({
    type: FacilityDto,
  })
  getFacilities(@Query() query: FacilitiesQueryDto): Promise<FacilityDto[]> {
    return this.facilitiesService.getFacilities(query);
  }

  @Post()
  @ApiResponse({
    type: FacilityDto,
  })
  createFacility(@Body() body: AddFacilityItemDto): Promise<FacilityDto> {
    return this.facilitiesService.createFacility(body);
  }

  @Patch(':id')
  @ApiResponse({
    type: FacilityDto,
  })
  updateFacility(
    @Param('id') id: string,
    @Body() body: UpdateFacilityItemDto,
  ): Promise<FacilityDto> {
    return this.facilitiesService.updateFacility(id, body);
  }

  @Delete(':id')
  @ApiCreatedResponse({
    type: FacilityDto,
  })
  deleteFacility(@Param('id') id: string): Promise<FacilityDto> {
    return this.facilitiesService.deleteFacility(id);
  }
}
