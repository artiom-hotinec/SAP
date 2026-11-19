import { ApiProperty } from '@nestjs/swagger';
import {
  IsDate,
  IsDefined,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateFacilityAdminUserDto } from '../user/dto.js';

export class ProviderDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  providerName: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  npi: string;

  @ApiProperty()
  phone: string;

  @ApiProperty()
  address: string;

  @ApiProperty({ type: String, nullable: true })
  firstName: string | null;

  @ApiProperty({ type: String, nullable: true })
  lastName: string | null;

  @ApiProperty()
  facilityName: string;

  @ApiProperty()
  dateHired: Date;
}

export enum ProviderSortBy {
  PROVIDER_NAME = 'providerName',
  FACILITY_NAME = 'facilityName',
}

export class ProvidersQueryDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiProperty({
    required: false,
    enum: ProviderSortBy,
    enumName: 'ProviderSortBy',
  })
  @IsOptional()
  @IsEnum(ProviderSortBy)
  sortBy?: ProviderSortBy;
}

export class CreateFacilityAdminProviderDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  npi: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({ type: String, format: 'date-time' })
  @Type(() => Date)
  @IsDate()
  dateHired: Date;

  @ApiProperty({ type: CreateFacilityAdminUserDto })
  @IsDefined()
  @ValidateNested()
  @Type(() => CreateFacilityAdminUserDto)
  user: CreateFacilityAdminUserDto;
}
