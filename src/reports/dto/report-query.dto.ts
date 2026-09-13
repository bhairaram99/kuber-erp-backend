import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ReportQueryDto {
  @ApiPropertyOptional({ example: '2026-01-01' })
  @IsOptional()
  @IsString()
  from?: string;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsOptional()
  @IsString()
  to?: string;

  @ApiPropertyOptional({ example: 'monthly', enum: ['daily', 'weekly', 'monthly'] })
  @IsOptional()
  @IsString()
  groupBy?: 'daily' | 'weekly' | 'monthly' = 'monthly';
}
