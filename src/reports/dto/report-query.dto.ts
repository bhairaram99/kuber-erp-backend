import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsOptional, IsString } from 'class-validator';

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

  @ApiPropertyOptional({ example: 14, enum: [7, 14, 30, 90], description: 'Dashboard sales trend lookback in days' })
  @IsOptional()
  @Type(() => Number)
  @IsIn([7, 14, 30, 90])
  days?: number;
}
