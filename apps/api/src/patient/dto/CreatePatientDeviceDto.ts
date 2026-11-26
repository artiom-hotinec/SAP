import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, Max, Min } from 'class-validator';

export class CreatePatientDeviceDto {
  @ApiProperty({ example: '(01)00827002005112(11)210821(10)1234(21)8234' })
  @IsString()
  @IsNotEmpty()
  deviceId: string; // GS1 ID of an existing, unassigned Device

  @ApiProperty({ example: 10, description: 'cmH2O' })
  @IsNumber()
  @Min(4)
  @Max(20)
  prescribedPressure: number;
}
