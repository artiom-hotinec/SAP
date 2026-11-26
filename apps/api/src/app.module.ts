import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { DbModule } from './db/db.module.js';
import { UserModule } from './user/user.module.js';
import { StatisticsModule } from './statistics/statistics.module.js';
import { FacilitiesModule } from './facilities/facilities.module.js';
import { ProvidersModule } from './providers/providers.module.js';
import { PasswordModule } from './password/password.module.js';
import { DeviceModule } from './device/device.module.js';
import { PatientModule } from './patient/patient.module.js';
import { StorageModule } from './storage/storage.module.js';
import { PatientMessageModule } from './patient-message/patient-message.module.js';
import { PatientDocumentModule } from './patient-document/patient-document.module.js';
import { PatientNoteModule } from './patient-note/patient-note.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DbModule,
    AuthModule,
    UserModule,
    StatisticsModule,
    FacilitiesModule,
    ProvidersModule,
    PasswordModule,
    DeviceModule,
    PatientModule,
    StorageModule,
    PatientMessageModule,
    PatientDocumentModule,
    PatientNoteModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
