import { Module } from '@nestjs/common';
import { StatisticsController } from './statistics.controller.js';
import { StatisticsService } from './statistics.service.js';
import { DbModule } from '../db/db.module.js';

@Module({
  imports: [DbModule],
  controllers: [StatisticsController],
  providers: [StatisticsService],
})
export class StatisticsModule {}
