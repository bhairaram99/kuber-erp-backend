import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ProductStatus } from '../../common/enums/product-status.enum';

export class CreateSupplierDto {
  @ApiPropertyOptional({ example: 'SUP-001' })
  @IsOptional()
  @IsString()
  supplierCode?: string;

  @ApiProperty({ example: 'Gujarat Timber Traders' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: '+91 9825000001' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'sales@gtt-timber.example' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 'Gujarat Timber Traders LLP' })
  @IsOptional()
  @IsString()
  company?: string;

  @ApiPropertyOptional({ example: 'Timber Market, Bhavnagar Road' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: '24BBBBB1111B1Z2' })
  @IsOptional()
  @IsString()
  taxNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ enum: ProductStatus, default: ProductStatus.ACTIVE })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus = ProductStatus.ACTIVE;
}
