import {
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  HttpCode,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  ParseUUIDPipe,
  Post,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard.js';
import { PatientDocumentService } from './patient-document.service.js';
import {
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiProduces,
} from '@nestjs/swagger';
import { PatientDocumentDto, UploadPatientDocumentDto } from './dto.js';
import { FileInterceptor } from '@nestjs/platform-express';
import { attachment } from '../common/filename.helper.js';

@Controller('patients/:patientId/documents')
@UseGuards(AuthGuard)
export class PatientDocumentController {
  constructor(private patientDocumentService: PatientDocumentService) {}

  @Get()
  @ApiOkResponse({ type: PatientDocumentDto, isArray: true })
  @ApiNotFoundResponse({ description: 'Unknown patient' })
  getDocuments(
    @Param('patientId', ParseUUIDPipe) patientId: string,
  ): Promise<PatientDocumentDto[]> {
    return this.patientDocumentService.getDocuments(patientId);
  }

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadPatientDocumentDto })
  @ApiCreatedResponse({ type: PatientDocumentDto })
  @ApiNotFoundResponse({ description: 'Unknown patient' })
  uploadDocument(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 20 * 1024 * 1024 }),
          new FileTypeValidator({
            fileType: /^(application\/pdf|image\/(png|jpeg))$/,
          }),
        ],
      }),
    )
    file: Express.Multer.File,
  ): Promise<PatientDocumentDto> {
    return this.patientDocumentService.uploadDocument(patientId, file);
  }

  @Get(':documentId/file')
  @ApiProduces('application/octet-stream')
  @ApiOkResponse({ schema: { type: 'string', format: 'binary' } })
  @ApiNotFoundResponse({ description: 'Unknown patient or document' })
  async downloadDocument(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Param('documentId', ParseUUIDPipe) documentId: string,
  ): Promise<StreamableFile> {
    const { doc, stream } = await this.patientDocumentService.downloadDocument(
      patientId,
      documentId,
    );
    return new StreamableFile(stream, {
      type: doc.mimeType,
      length: doc.size,
      disposition: attachment(doc.name),
    });
  }

  @Delete(':documentId')
  @HttpCode(204)
  @ApiNoContentResponse()
  @ApiNotFoundResponse({ description: 'Unknown patient or document' })
  deleteDocument(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Param('documentId', ParseUUIDPipe) documentId: string,
  ): Promise<void> {
    return this.patientDocumentService.deleteDocument(patientId, documentId);
  }
}
