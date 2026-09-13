import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ProductStatus } from '../../common/enums/product-status.enum';

export class CreateProductDto {
  @ApiProperty({ example: 'Burma Teak Timber Log' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'TEAK-BUR-001' })
  @IsNotEmpty()
  @IsString()
  sku: string;

  @ApiPropertyOptional({ example: '8901234567890' })
  @IsOptional()
  @IsString()
  barcode?: string;

  @ApiProperty({ example: '64e8b392b4a5f334d701a234' })
  @IsNotEmpty()
  @IsString()
  categoryId: string;

  @ApiPropertyOptional({ example: 'Premium quality golden brown Burma teak wood' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'Teak' })
  @IsOptional()
  @IsString()
  woodType?: string = 'Teak';

  @ApiPropertyOptional({ example: 'Grade A' })
  @IsOptional()
  @IsString()
  grade?: string = 'Grade A';

  @ApiPropertyOptional({ example: 'Premium Export' })
  @IsOptional()
  @IsString()
  quality?: string = 'Premium';

  @ApiPropertyOptional({ example: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  thickness?: number = 0;

  @ApiPropertyOptional({ example: 150 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  width?: number = 0;

  @ApiPropertyOptional({ example: 2400 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  length?: number = 0;

  @ApiPropertyOptional({ example: 'cft' })
  @IsOptional()
  @IsString()
  unit?: string = 'cft';

  @ApiPropertyOptional({ example: 'Golden Brown' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ example: 'Rough Sawn' })
  @IsOptional()
  @IsString()
  finish?: string = 'Rough Sawn';

  @ApiPropertyOptional({ example: 'Burma Crown' })
  @IsOptional()
  @IsString()
  brand?: string = 'Generic';

  @ApiProperty({ example: 400 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  purchasePrice: number;

  @ApiProperty({ example: 600 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  sellingPrice: number;

  @ApiPropertyOptional({ example: 550 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  wholesalePrice?: number = 0;

  @ApiPropertyOptional({ example: 18 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  taxPercentage?: number = 18;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  openingStock?: number = 0;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minimumStock?: number = 10;

  @ApiPropertyOptional({ example: 500 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maximumStock?: number = 500;

  @ApiPropertyOptional({ example: 'Yard B - Bay 4' })
  @IsOptional()
  @IsString()
  location?: string = 'Yard A';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  image?: string;

  @ApiPropertyOptional({ enum: ProductStatus, default: ProductStatus.ACTIVE })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus = ProductStatus.ACTIVE;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
