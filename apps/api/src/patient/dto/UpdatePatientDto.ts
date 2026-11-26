import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { IsOptional, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreatePatientDeviceDto } from './CreatePatientDeviceDto.js';
import { CreatePatientDto } from './CreatePatientDto.js';
import { UpdatePatientClinicalInfoDto } from './UpdatePatientClinicalInfoDto.js';

export class UpdatePatientDto extends PartialType(
  OmitType(CreatePatientDto, ['providerId', 'clinicalInfo', 'device'] as const),
  { skipNullProperties: false }, // null on a required field → 400, not a Prisma 500
) {
  @ApiProperty({
    required: false,
    description: 'Omitted = keep the current provider',
  })
  @IsOptional()
  @IsUUID()
  providerId?: string;

  @ApiProperty({ type: UpdatePatientClinicalInfoDto, required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdatePatientClinicalInfoDto)
  clinicalInfo?: UpdatePatientClinicalInfoDto;

  @ApiProperty({
    type: CreatePatientDeviceDto,
    required: false,
    nullable: true,
    description:
      'Omitted = unchanged; null = unassign the device; another deviceId = reassign',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreatePatientDeviceDto)
  device?: CreatePatientDeviceDto | null;
}
