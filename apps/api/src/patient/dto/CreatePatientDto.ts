import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsDefined,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { $Enums } from '../../generated/prisma/client.js';
import { CreatePatientClinicalInfoDto } from './CreatePatientClinicalInfoDto.js';
import { CreatePatientDeviceDto } from './CreatePatientDeviceDto.js';

export class CreatePatientDto {
  // Step 1
  @ApiProperty({ example: 'Wayne' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Bernard' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({
    required: false,
    type: String,
    format: 'date',
    example: '1971-02-20',
  })
  @IsOptional()
  @IsDateString()
  dob?: string;

  @ApiProperty({ required: false, enum: $Enums.Sex, enumName: 'Sex' })
  @IsOptional()
  @IsEnum($Enums.Sex)
  sex?: $Enums.Sex;

  @ApiProperty({
    required: false,
    example: 71,
    description: 'Total inches (ft * 12 + in)',
  })
  @IsOptional()
  @IsNumber()
  @Min(12)
  @Max(108)
  heightIn?: number;

  @ApiProperty({ required: false, example: 220 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(1500)
  weightLb?: number;

  @ApiProperty({ example: 'waynebernard@gmail.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '(303) 941-5555' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  // Step 2
  @ApiProperty({ example: '650 Hunt Club Lane' })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiProperty({ example: '80014' })
  @Matches(/^\d{5}(-\d{4})?$/)
  zip: string;

  @ApiProperty({ example: 'Denver' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({ example: 'CO' })
  @Matches(/^[A-Z]{2}$/)
  state: string;

  // Step 3
  @ApiProperty({
    required: false,
    description: 'Defaults to the signed-in provider',
  })
  @IsOptional()
  @IsUUID()
  providerId?: string;

  // Steps 3–4
  @ApiProperty({ type: CreatePatientClinicalInfoDto })
  @IsDefined()
  @ValidateNested()
  @Type(() => CreatePatientClinicalInfoDto)
  clinicalInfo: CreatePatientClinicalInfoDto;

  // Step 5 (optional: a device can be assigned later)
  @ApiProperty({ type: CreatePatientDeviceDto, required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreatePatientDeviceDto)
  device?: CreatePatientDeviceDto;
}
