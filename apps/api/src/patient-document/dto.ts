import { ApiProperty } from '@nestjs/swagger';

export class PatientDocumentDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string; // original filename, shown in the card

  @ApiProperty()
  mimeType: string;

  @ApiProperty()
  size: number; // bytes

  @ApiProperty()
  uploadedAt: Date;
}

export class UploadPatientDocumentDto {
  @ApiProperty({ type: 'string', format: 'binary' })
  file: unknown;
}
