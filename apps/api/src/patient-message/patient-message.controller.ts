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
import { PatientMessageService } from './patient-message.service.js';
import { CreatePatientMessageDto, PatientMessageDto } from './dto.js';
import {
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import { SessionInfo } from '../auth/session-info.decorator.js';
import { GetSessionInfoDto } from '../auth/dto.js';

@Controller('patients/:patientId/messages')
@UseGuards(AuthGuard)
export class PatientMessageController {
  constructor(private patientMessageService: PatientMessageService) {}

  @Get()
  @ApiOkResponse({ type: PatientMessageDto, isArray: true })
  @ApiNotFoundResponse({ description: 'Unknown patient' })
  getMessages(
    @Param('patientId', ParseUUIDPipe) patientId: string,
  ): Promise<PatientMessageDto[]> {
    return this.patientMessageService.getMessages(patientId);
  }

  @Post()
  @ApiCreatedResponse({ type: PatientMessageDto })
  @ApiNotFoundResponse({ description: 'Unknown patient' })
  sendMessage(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Body() body: CreatePatientMessageDto,
    @SessionInfo() session: GetSessionInfoDto,
  ): Promise<PatientMessageDto> {
    return this.patientMessageService.sendMessage(patientId, session.id, body);
  }
}
