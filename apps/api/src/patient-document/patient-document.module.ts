import { Module } from '@nestjs/common';
import { PatientDocumentController } from './patient-document.controller.js';
import { PatientDocumentService } from './patient-document.service.js';
import { DbModule } from '../db/db.module.js';
import { StorageModule } from '../storage/storage.module.js';

@Module({
  imports: [DbModule, StorageModule],
  controllers: [PatientDocumentController],
  providers: [PatientDocumentService],
})
export class PatientDocumentModule {}
