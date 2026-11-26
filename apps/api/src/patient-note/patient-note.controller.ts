import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard.js';
import { CreatePatientNoteDto, PatientNoteDto } from './dto.js';
import { PatientNoteService } from './patient-note.service.js';
import {
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import { SessionInfo } from '../auth/session-info.decorator.js';
import { GetSessionInfoDto } from '../auth/dto.js';

@Controller('patients/:patientId/notes')
@UseGuards(AuthGuard)
export class PatientNoteController {
  constructor(private patientNoteService: PatientNoteService) {}

  @Get()
  @ApiOkResponse({ type: PatientNoteDto, isArray: true })
  @ApiNotFoundResponse({ description: 'Unknown patient' })
  getNotes(
    @Param('patientId', ParseUUIDPipe) patientId: string,
  ): Promise<PatientNoteDto[]> {
    return this.patientNoteService.getNotes(patientId);
  }

  @Post()
  @ApiCreatedResponse({ type: PatientNoteDto })
  @ApiNotFoundResponse({ description: 'Unknown patient' })
  createNote(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Body() body: CreatePatientNoteDto,
    @SessionInfo() session: GetSessionInfoDto,
  ): Promise<PatientNoteDto> {
    return this.patientNoteService.createNote(patientId, session.id, body);
  }
}
