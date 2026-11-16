import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service.js';
import { ApiResponse } from '@nestjs/swagger';
import { ChangePasswordBodyDto, UserDto } from './dto.js';
import { SessionInfo } from '../auth/session-info.decorator.js';
import { GetSessionInfoDto } from '../auth/dto.js';
import { AuthGuard } from '../auth/auth.guard.js';

@Controller('user')
@UseGuards(AuthGuard)
export class UserController {
  constructor(private userService: UserService) {}

  @Get()
  @ApiResponse({
    type: UserDto,
  })
  getUser(@SessionInfo() session: GetSessionInfoDto): Promise<UserDto> {
    return this.userService.getUserById(session.id);
  }

  @Patch()
  @HttpCode(HttpStatus.NO_CONTENT)
  async changePassword(
    @Body() body: ChangePasswordBodyDto,
    @SessionInfo() session: GetSessionInfoDto,
  ): Promise<void> {
    await this.userService.changePassword(session.id, body);
  }
}
