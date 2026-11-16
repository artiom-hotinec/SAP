import { ApiProperty } from '@nestjs/swagger';

export class StatisticsDto {
  @ApiProperty()
  patients: number;

  @ApiProperty()
  facilities: number;

  @ApiProperty()
  providers: number;

  @ApiProperty()
  devices: number;
}
