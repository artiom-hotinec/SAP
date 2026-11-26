import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class PatientNoteDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  body: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty()
  authorId: string;

  @ApiProperty({ description: 'Author first + last name, falls back to email' })
  authorName: string;
}

export class CreatePatientNoteDto {
  @ApiProperty({ example: 'Patient reports mask discomfort, refit scheduled.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  body: string;
}
