import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDefined,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { CreateFacilityAdminProviderDto } from '../providers/dto.js';

export class FacilityDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  ein: string;

  @ApiProperty()
  permit: string;

  @ApiProperty()
  npi: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  city: string;

  @ApiProperty()
  state: string;

  @ApiProperty()
  phone: string;

  @ApiProperty()
  address: string;

  @ApiProperty({ required: false })
  @IsOptional()
  unit: string | null;

  @ApiProperty()
  zip: string;

  @ApiProperty()
  contactName: string;

  @ApiProperty()
  @IsEmail()
  contactEmail: string;

  @ApiProperty()
  active: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  updatedAt?: Date;
}

export enum FacilitySortBy {
  NAME = 'name',
  DATE_ADDED = 'dateAdded',
}

export class FacilitiesQueryDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEnum(FacilitySortBy)
  sortBy?: FacilitySortBy;
}

export class AddFacilityItemDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  ein: string;

  @ApiProperty()
  @IsString()
  permit: string;

  @ApiProperty()
  @IsString()
  npi: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  state: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({ required: false })
  @IsOptional()
  unit?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  zip: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  contactName: string;

  @ApiProperty()
  @IsEmail()
  contactEmail: string;

  @ApiProperty({ type: CreateFacilityAdminProviderDto })
  @IsDefined()
  @ValidateNested()
  @Type(() => CreateFacilityAdminProviderDto)
  admin: CreateFacilityAdminProviderDto;
}

export class UpdateFacilityItemDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  state: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({ required: false })
  @IsOptional()
  unit?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  zip: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  contactName: string;

  @ApiProperty()
  @IsEmail()
  contactEmail: string;
}
