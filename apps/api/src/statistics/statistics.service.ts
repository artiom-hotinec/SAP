import { Injectable } from '@nestjs/common';
import { DbService } from '../db/db.service.js';

@Injectable()
export class StatisticsService {
  constructor(private dbService: DbService) {}

  async getStatisticsByUserId() {
    const [patientsCount, providersCount, facilitiesCount, devicesCount] =
      await Promise.all([
        this.dbService.patient.count(),
        this.dbService.provider.count(),
        this.dbService.facility.count(),
        this.dbService.device.count(),
      ]);

    return {
      patients: patientsCount,
      facilities: facilitiesCount,
      providers: providersCount,
      devices: devicesCount,
    };
  }
}
