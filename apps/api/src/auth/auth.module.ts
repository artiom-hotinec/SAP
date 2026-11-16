import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { resolve } from 'node:path';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { CookieService } from './cookie.service.js';
import { UserModule } from '../user/user.module.js';
import { PasswordModule } from '../password/password.module.js';

@Module({
  imports: [
    PasswordModule,
    UserModule,
    JwtModule.register({
      global: true,
      // secret: process.env.JWT_SECRET,
      secret: resolve(__dirname, '../../../../.env'),
      signOptions: { expiresIn: '1d' }, // jwt will be valid 1 day
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, CookieService],
})
export class AuthModule {}
