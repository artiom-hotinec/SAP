import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { DbService } from '../db/db.service.js';
import { ChangePasswordBodyDto } from './dto.js';
import { PasswordService } from '../password/password.service.js';

@Injectable()
export class UserService {
  constructor(
    private db: DbService,
    private passwordService: PasswordService,
  ) {}

  async create(email: string, passwordHash: string, salt: string) {
    const user = await this.db.user.create({
      data: { email, passwordHash, salt },
    });

    return user;
  }

  findByEmail(email: string) {
    return this.db.user.findFirst({ where: { email } });
  }

  async getUserById(userId: string) {
    return this.db.user.findFirstOrThrow({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
        phone: true,
        unitsPreference: true,
        role: true,
      },
    });
  }

  async changePassword(id: string, dto: ChangePasswordBodyDto) {
    const user = await this.db.user.findFirstOrThrow({
      where: { id },
      select: {
        passwordHash: true,
        salt: true,
      },
    });

    const isPasswordValid = this.passwordService.verifyPassword(
      dto.oldPassword,
      user.passwordHash,
      user.salt,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Prevent reusing the current password
    const isSamePassword = this.passwordService.verifyPassword(
      dto.newPassword,
      user.passwordHash,
      user.salt,
    );

    if (isSamePassword) {
      throw new BadRequestException(
        'New password must be different from the current password',
      );
    }

    const salt = this.passwordService.getSalt();
    const passwordHash = this.passwordService.getHash(dto.newPassword, salt);

    await this.db.user.update({
      where: { id },
      data: {
        passwordHash,
        salt,
      },
    });
  }
}
