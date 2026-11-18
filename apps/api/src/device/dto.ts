import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
} from 'class-validator';

export class DeviceModelDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ type: String, nullable: true })
  gtin: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt?: Date;
}

export class DeviceDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  deviceId: string;

  @ApiProperty()
  modelName: string;

  @ApiProperty()
  facilityName: string | null;

  @ApiProperty()
  manufactureDate: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  lastConnectedAt: Date | null;
}

export enum DeviceSortBy {
  MODEL = 'model',
  DATE_ADDED = 'dateAdded',
}

export class DeviceQueryDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEnum(DeviceSortBy)
  sortBy?: DeviceSortBy;
}

export class AddDeviceItemDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  deviceId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  facilityId?: string;
}

export class UpdateDeviceItemDto {
  @ApiProperty({ example: '(01)00827002005112(11)210821(10)1234(21)8234' })
  @IsString()
  @IsNotEmpty()
  deviceId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  facilityId?: string;
}

export class AddDeviceModelItemDto {
  @ApiProperty({ example: 'SAP 2' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ required: false, example: '00827002005112' })
  @IsOptional()
  @Matches(/^\d{14}$/, { message: 'gtin must be 14 digits' })
  gtin?: string;
}

export class UpdateDeviceModelItemDto {
  @ApiProperty({ required: false, example: 'SAP 2' })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiProperty({
    required: false,
    example: '00827002005112',
    description: 'GTIN-14. Cannot be changed once devices use the model.',
  })
  @IsOptional()
  @Matches(/^\d{14}$/, { message: 'gtin must be 14 digits' })
  gtin?: string;
}
