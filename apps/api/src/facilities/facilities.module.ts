import { Module } from '@nestjs/common';
import { FacilitiesController } from './facilities.controller.js';
import { FacilitiesService } from './facilities.service.js';
import { DbModule } from '../db/db.module.js';
import { PasswordModule } from '../password/password.module.js';

@Module({
  imports: [DbModule, PasswordModule],
  controllers: [FacilitiesController],
  providers: [FacilitiesService],
})
export class FacilitiesModule {}
