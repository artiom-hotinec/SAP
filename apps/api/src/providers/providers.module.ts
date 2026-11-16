import { Module } from '@nestjs/common';
import { ProvidersController } from './providers.controller.js';
import { ProvidersService } from './providers.service.js';
import { DbModule } from '../db/db.module.js';

@Module({
  imports: [DbModule],
  controllers: [ProvidersController],
  providers: [ProvidersService],
})
export class ProvidersModule {}
