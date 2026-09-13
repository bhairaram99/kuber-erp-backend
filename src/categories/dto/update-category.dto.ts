import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ProductStatus } from '../../common/enums/product-status.enum';

export class UpdateCategoryDto {
  @ApiPropertyOptional({ example: 'Hardwood Timber' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'High-density timber logs and planks' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: ProductStatus })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;
}
