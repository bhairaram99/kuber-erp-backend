import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreatePermissionDto {
  @ApiProperty({ example: 'products.create' })
  @IsNotEmpty()
  @IsString()
  code: string;

  @ApiProperty({ example: 'Create Product' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'products' })
  @IsNotEmpty()
  @IsString()
  module: string;

  @ApiPropertyOptional({ example: 'Permission to add new products' })
  @IsOptional()
  @IsString()
  description?: string;
}
