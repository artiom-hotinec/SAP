import { Module } from '@nestjs/common';
import { PatientMessageController } from './patient-message.controller.js';
import { PatientMessageService } from './patient-message.service.js';
import { DbModule } from '../db/db.module.js';

@Module({
  imports: [DbModule],
  controllers: [PatientMessageController],
  providers: [PatientMessageService],
})
export class PatientMessageModule {}
