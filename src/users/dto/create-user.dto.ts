import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { UserStatus } from '../../common/enums/user-status.enum';

export class CreateUserDto {
  @ApiProperty({ example: 'Bhairav Timber' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'user@wooderp.com' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: '+91 9876543210' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'Secret123!' })
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: '64e8b392b4a5f334d701a234', description: 'Role ObjectId' })
  @IsNotEmpty()
  @IsString()
  roleId: string;

  @ApiPropertyOptional({ enum: UserStatus, default: UserStatus.ACTIVE })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus = UserStatus.ACTIVE;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  avatar?: string;
}
