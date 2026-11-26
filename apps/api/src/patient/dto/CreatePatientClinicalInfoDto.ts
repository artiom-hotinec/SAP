import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';

export class CreatePatientClinicalInfoDto {
  @ApiProperty({
    required: false,
    type: String,
    format: 'date',
    example: '2021-12-11',
  })
  @IsOptional()
  @IsDateString()
  lastAppointment?: string;

  @ApiProperty()
  @IsBoolean()
  maskFitting: boolean;

  @ApiProperty({
    required: false,
    type: String,
    format: 'date',
    description: 'Required when maskFitting is true',
  })
  @ValidateIf((o: CreatePatientClinicalInfoDto) => o.maskFitting)
  @IsDateString()
  maskFittingDate?: string;

  @ApiProperty()
  @IsBoolean()
  sleepStudy: boolean;

  @ApiProperty({
    required: false,
    type: String,
    format: 'date',
    description: 'Required when sleepStudy is true',
  })
  @ValidateIf((o: CreatePatientClinicalInfoDto) => o.sleepStudy)
  @IsDateString()
  sleepStudyDate?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  atHomeStudy?: boolean;

  @ApiProperty({ required: false, example: 90 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  sleepStudyBloodOxygenPct?: number;

  @ApiProperty({ required: false, example: 56 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(300)
  sleepStudyHeartRateBpm?: number;

  @ApiProperty({
    required: false,
    example: 3,
    description: 'Apneas, hours snoring',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(24)
  sleepStudySnoringHours?: number;
}
