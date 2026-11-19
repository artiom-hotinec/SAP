import { Injectable } from '@nestjs/common';
import { pbkdf2Sync, randomBytes, timingSafeEqual } from 'crypto';

@Injectable()
export class PasswordService {
  getSalt(size = 16) {
    return randomBytes(size).toString('hex');
  }

  getHash(password: string, salt: string) {
    return pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  }

  verifyPassword(
    password: string,
    passwordHash: string,
    salt: string,
  ): boolean {
    const hash = this.getHash(password, salt);

    const hashBuffer = Buffer.from(hash, 'hex');
    const storedHashBuffer = Buffer.from(passwordHash, 'hex');

    if (hashBuffer.length !== storedHashBuffer.length) {
      return false;
    }

    return timingSafeEqual(hashBuffer, storedHashBuffer);
  }
}
