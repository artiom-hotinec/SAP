import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class ProviderDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  providerName: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ type: String, nullable: true })
  npi: string | null;

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

  @ApiProperty({ type: Date, nullable: true })
  dateHired: Date | null;
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
