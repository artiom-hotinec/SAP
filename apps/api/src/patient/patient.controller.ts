import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConsumes,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiProduces,
  ApiResponse,
} from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard.js';
import { PatientQueryDto } from './dto/PatientQueryDto.js';
import { PatientDto } from './dto/PatientDto.js';
import { FileInterceptor } from '@nestjs/platform-express';
import { PatientService } from './patient.service.js';
import { SessionInfo } from '../auth/session-info.decorator.js';
import { GetSessionInfoDto } from '../auth/dto.js';
import { CreatePatientDto } from './dto/CreatePatientDto.js';
import { UpdatePatientDto } from './dto/UpdatePatientDto.js';

@Controller('patients')
@UseGuards(AuthGuard)
export class PatientController {
  constructor(private patientService: PatientService) {}

  @Get()
  @ApiResponse({
    type: PatientDto,
    isArray: true,
  })
  getAllPatients(
    @Query() query: PatientQueryDto,
    @SessionInfo() session: GetSessionInfoDto,
  ): Promise<PatientDto[]> {
    return this.patientService.getAllPatients(session.id, query);
  }

  @Get(':id')
  @ApiResponse({
    type: PatientDto,
  })
  getPatient(
    @Param('id', ParseUUIDPipe) patientId: string,
    @SessionInfo() session: GetSessionInfoDto,
  ): Promise<PatientDto> {
    return this.patientService.getPatient(session.id, patientId);
  }

  @Post()
  @ApiResponse({
    type: PatientDto,
  })
  createPatient(
    @Body() body: CreatePatientDto,
    @SessionInfo() session: GetSessionInfoDto,
  ): Promise<PatientDto> {
    return this.patientService.createPatient(session.id, body);
  }

  @Patch(':id')
  @ApiResponse({
    type: PatientDto,
  })
  updatePatient(
    @Param('id', ParseUUIDPipe) patientId: string,
    @SessionInfo() session: GetSessionInfoDto,
    @Body() body: UpdatePatientDto,
  ): Promise<PatientDto> {
    return this.patientService.updatePatient(session.id, patientId, body);
  }

  @Delete(':id')
  @ApiOkResponse({
    type: PatientDto,
  })
  deletePatient(
    @Param('id', ParseUUIDPipe) patientId: string,
    @SessionInfo() session: GetSessionInfoDto,
  ): Promise<PatientDto> {
    return this.patientService.deletePatient(session.id, patientId);
  }

  @Put(':id/photo')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiOkResponse({ type: PatientDto })
  @ApiBadRequestResponse({
    description: 'invalid-photo (not JPG/PNG/TIFF, or over 5 MB)',
  })
  @ApiNotFoundResponse({ description: 'Unknown patient' })
  addPhoto(
    @Param('id', ParseUUIDPipe) patientId: string,
    @SessionInfo() session: GetSessionInfoDto,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<PatientDto> {
    return this.patientService.addPhoto(session.id, patientId, file);
  }

  @Get(':id/photo')
  @ApiProduces('image/jpeg')
  @ApiOkResponse({ schema: { type: 'string', format: 'binary' } })
  @ApiNotFoundResponse({ description: 'Unknown patient or no photo' })
  async getPhoto(
    @Param('id', ParseUUIDPipe) patientId: string,
    @SessionInfo() session: GetSessionInfoDto,
  ): Promise<StreamableFile> {
    const { stream } = await this.patientService.getPhoto(
      session.id,
      patientId,
    );
    return new StreamableFile(stream, {
      type: 'image/jpeg',
      disposition: 'inline',
    });
  }

  @Delete(':id/photo')
  @ApiOkResponse({ type: PatientDto })
  @ApiNotFoundResponse({ description: 'Unknown patient or no photo' })
  deletePhoto(
    @Param('id', ParseUUIDPipe) patientId: string,
    @SessionInfo() session: GetSessionInfoDto,
  ): Promise<PatientDto> {
    return this.patientService.deletePhoto(session.id, patientId);
  }
}
