import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard.js';
import { ApiResponse } from '@nestjs/swagger';
import { ProviderDto, ProvidersQueryDto } from './dto.js';
import { ProvidersService } from './providers.service.js';

@Controller('providers')
@UseGuards(AuthGuard)
export class ProvidersController {
  constructor(private providersService: ProvidersService) {}

  @Get()
  @ApiResponse({
    type: ProviderDto,
    isArray: true,
  })
  getProviders(@Query() query: ProvidersQueryDto): Promise<ProviderDto[]> {
    return this.providersService.getAllProviders(query);
  }

  @Get(':id')
  @ApiResponse({
    type: ProviderDto,
  })
  getProvider(@Param('id') id: string): Promise<ProviderDto> {
    return this.providersService.getProviderById(id);
  }
}
