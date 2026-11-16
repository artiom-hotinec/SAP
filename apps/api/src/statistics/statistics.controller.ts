import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { StatisticsService } from './statistics.service.js';
import { ApiOkResponse } from '@nestjs/swagger';
import { StatisticsDto } from './dto.js';
import { AuthGuard } from '../auth/auth.guard.js';

@Controller('statistics')
@UseGuards(AuthGuard)
export class StatisticsController {
  constructor(private statisticsService: StatisticsService) {}

  @Get()
  @ApiOkResponse({
    type: StatisticsDto,
  })
  @HttpCode(HttpStatus.OK)
  getStatistics(): Promise<StatisticsDto> {
    return this.statisticsService.getStatisticsByUserId();
  }
}
