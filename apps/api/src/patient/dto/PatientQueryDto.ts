import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum PatientSortBy {
  LAST_NAME = 'lastName',
  DATE_ADDED = 'dateAdded',
  UNREAD_MESSAGES = 'unreadMessages',
}

export enum PatientFilterBy {
  ALL_PATIENTS = 'allPatients',
  ACTIVE_PATIENTS = 'activePatients',
  INACTIVE_PATIENTS = 'inActivePatients',
  MY_PATIENTS = 'myPatients',
}

export class PatientQueryDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiProperty({
    required: false,
    enum: PatientSortBy,
    enumName: 'PatientSortBy',
  })
  @IsOptional()
  @IsEnum(PatientSortBy)
  sortBy?: PatientSortBy;

  @ApiProperty({
    required: false,
    enum: PatientFilterBy,
    enumName: 'PatientFilterBy',
  })
  @IsOptional()
  @IsEnum(PatientFilterBy)
  filterBy?: PatientFilterBy[];
}
