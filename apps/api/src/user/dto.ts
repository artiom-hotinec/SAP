import { ApiProperty } from '@nestjs/swagger';
import { $Enums } from '../generated/prisma/client.js';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UserDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ type: String, nullable: true })
  firstName: string | null;

  @ApiProperty({ type: String, nullable: true })
  lastName: string | null;

  @ApiProperty({ type: String, nullable: true })
  avatar: string | null;

  @ApiProperty({ type: String, nullable: true })
  phone: string | null;

  @ApiProperty({
    enum: [$Enums.UnitsPreference.IMPERIAL, $Enums.UnitsPreference.METRIC],
  })
  unitsPreference: $Enums.UnitsPreference;

  @ApiProperty({
    enum: [
      $Enums.UserRole.PATIENT,
      $Enums.UserRole.PORTAL_ADMIN,
      $Enums.UserRole.PROVIDER,
      $Enums.UserRole.SUPER_ADMIN,
    ],
  })
  role: $Enums.UserRole;
}

export class ChangePasswordBodyDto {
  @ApiProperty({
    example: '1234',
  })
  @IsNotEmpty()
  oldPassword: string;

  @ApiProperty({
    example: '4321',
  })
  @IsNotEmpty()
  newPassword: string;
}

export class CreateFacilityAdminUserDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  phone?: string;
}
