import { PartialType } from '@nestjs/swagger';
import { CreatePatientClinicalInfoDto } from './CreatePatientClinicalInfoDto.js';

export class UpdatePatientClinicalInfoDto extends PartialType(
  CreatePatientClinicalInfoDto,
  { skipNullProperties: false },
) {}
