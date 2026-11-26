import { ApiProperty } from '@nestjs/swagger';
import { $Enums } from '../../generated/prisma/client.js';

export class PatientDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  phone: string;

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  dob: Date | null;

  @ApiProperty({
    enum: [$Enums.Sex.FEMALE, $Enums.Sex.MALE, $Enums.Sex.OTHER],
    enumName: 'Sex',
    nullable: true,
  })
  sex: $Enums.Sex | null;

  @ApiProperty({ type: Number, nullable: true })
  heightIn: number | null;

  @ApiProperty({ type: Number, nullable: true })
  weightLb: number | null;

  @ApiProperty({ type: String, nullable: true })
  address: string | null;

  @ApiProperty({ type: String, nullable: true })
  city: string | null;

  @ApiProperty({ type: String, nullable: true })
  state: string | null;

  @ApiProperty({ type: String, nullable: true })
  unit: string | null;

  @ApiProperty({ type: String, nullable: true })
  zip: string | null;

  @ApiProperty()
  providerId: string;

  @ApiProperty({ description: 'Provider first + last name' })
  providerName: string;

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  lastAppointment: Date | null;

  @ApiProperty({
    description: 'Has the patient registered in the mobile app (userId set)',
  })
  registered: boolean;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;
}
