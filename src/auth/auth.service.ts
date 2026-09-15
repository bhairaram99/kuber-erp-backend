import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersRepository } from '../users/users.repository';
import { LoginDto } from './dto/login.dto';
import { UserStatus } from '../common/enums/user-status.enum';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.usersRepository.findByEmail(dto.email, true);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException(`Account is ${user.status.toLowerCase()}. Please contact your administrator.`);
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    await this.usersRepository.updateLastLogin(user._id.toString());

    const roleObj: any = user.role;
    const permissions: string[] = roleObj?.permissions || [];
    const roleName: string = roleObj?.name || 'STAFF';

    const payload: JwtPayload = {
      sub: user._id.toString(),
      email: user.email,
      roleId: roleObj?._id?.toString() || '',
      roleName,
      permissions,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        status: user.status,
        role: {
          id: roleObj?._id?.toString(),
          name: roleName,
          description: roleObj?.description,
          permissions,
        },
      },
    };
  }

  async getMe(userId: string) {
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const roleObj: any = user.role;
    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar,
      status: user.status,
      lastLoginAt: user.lastLoginAt,
      role: {
        id: roleObj?._id?.toString(),
        name: roleObj?.name,
        description: roleObj?.description,
        permissions: roleObj?.permissions || [],
      },
    };
  }
}
