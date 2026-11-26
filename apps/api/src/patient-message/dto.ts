import { ApiProperty } from '@nestjs/swagger';
import { MessageDirection } from '../generated/prisma/enums.js';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class PatientMessageDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  body: string;

  @ApiProperty({
    enum: MessageDirection,
    example: MessageDirection.PROVIDER_TO_PATIENT,
  })
  direction: MessageDirection; // PROVIDER_TO_PATIENT | PATIENT_TO_PROVIDER

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty()
  providerId: string;

  @ApiProperty({
    example: 'first + last name, falls back to email, like notes',
  })
  providerName: string;
}

export class CreatePatientMessageDto {
  @ApiProperty({ example: 'Patient reports mask discomfort, refit scheduled.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  body: string;
}
