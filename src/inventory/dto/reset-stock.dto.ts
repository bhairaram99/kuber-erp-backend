import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class ResetStockDto {
  @ApiProperty({ example: '64e8b392b4a5f334d701a234' })
  @IsNotEmpty()
  @IsString()
  productId: string;

  @ApiProperty({ example: 0, description: 'New baseline stock count to force-set' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  newStock: number;

  @ApiProperty({ example: 'Annual physical audit reconciliation' })
  @IsNotEmpty()
  @IsString()
  reason: string;

  @ApiPropertyOptional({ example: 'Approved by Managing Director' })
  @IsOptional()
  @IsString()
  notes?: string;
}
