import { Module } from '@nestjs/common';
import { PatientController } from './patient.controller.js';
import { PatientService } from './patient.service.js';
import { DbModule } from '../db/db.module.js';
import { StorageModule } from '../storage/storage.module.js';

@Module({
  imports: [DbModule, StorageModule],
  controllers: [PatientController],
  providers: [PatientService],
})
export class PatientModule {}
