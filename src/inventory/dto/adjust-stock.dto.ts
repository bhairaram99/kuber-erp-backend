import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { InventoryTransactionType } from '../../common/enums/inventory-transaction-type.enum';

export class AdjustStockDto {
  @ApiProperty({ example: '64e8b392b4a5f334d701a234' })
  @IsNotEmpty()
  @IsString()
  productId: string;

  @ApiProperty({
    enum: [
      InventoryTransactionType.ADJUSTMENT_IN,
      InventoryTransactionType.ADJUSTMENT_OUT,
      InventoryTransactionType.DAMAGE,
      InventoryTransactionType.LOSS,
      InventoryTransactionType.FOUND,
      InventoryTransactionType.CORRECTION,
    ],
    example: InventoryTransactionType.ADJUSTMENT_IN,
  })
  @IsNotEmpty()
  @IsEnum(InventoryTransactionType)
  type: InventoryTransactionType;

  @ApiProperty({ example: 15, description: 'Absolute quantity to adjust (system assigns sign based on type)' })
  @Type(() => Number)
  @IsNumber()
  quantity: number;

  @ApiProperty({ example: 'Physical stock recount matched excess inventory' })
  @IsNotEmpty()
  @IsString()
  reason: string;

  @ApiPropertyOptional({ example: 'Verified by warehouse manager' })
  @IsOptional()
  @IsString()
  notes?: string;
}
