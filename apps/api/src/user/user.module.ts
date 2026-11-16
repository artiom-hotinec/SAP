import { Module } from '@nestjs/common';
import { UserService } from './user.service.js';
import { DbModule } from '../db/db.module.js';
import { UserController } from './user.controller.js';
import { PasswordModule } from '../password/password.module.js';

@Module({
  imports: [DbModule, PasswordModule],
  providers: [UserService],
  exports: [UserService],
  controllers: [UserController],
})
export class UserModule {}
