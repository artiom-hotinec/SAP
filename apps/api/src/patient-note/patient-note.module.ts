import { Module } from '@nestjs/common';
import { PatientNoteController } from './patient-note.controller.js';
import { PatientNoteService } from './patient-note.service.js';
import { DbModule } from '../db/db.module.js';

@Module({
  imports: [DbModule],
  controllers: [PatientNoteController],
  providers: [PatientNoteService],
})
export class PatientNoteModule {}
