import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { PaymentMethod, PaymentType } from '../../common/enums/payment.enum';

export class CreatePaymentDto {
  @ApiProperty({ enum: PaymentType, example: PaymentType.RECEIVED })
  @IsNotEmpty()
  @IsEnum(PaymentType)
  type: PaymentType;

  @ApiPropertyOptional({ example: 'SALE' })
  @IsOptional()
  @IsString()
  referenceType?: string = 'DIRECT';

  @ApiPropertyOptional({ example: 'INV-2026-0001' })
  @IsOptional()
  @IsString()
  referenceId?: string;

  @ApiPropertyOptional({ example: '64e8b392b4a5f334d701a234' })
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiPropertyOptional({ example: '64e8b392b4a5f334d701a234' })
  @IsOptional()
  @IsString()
  supplierId?: string;

  @ApiProperty({ example: 5000 })
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ enum: PaymentMethod, example: PaymentMethod.UPI })
  @IsNotEmpty()
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiPropertyOptional({ example: '2026-09-07' })
  @IsOptional()
  @IsString()
  paymentDate?: string;

  @ApiPropertyOptional({ example: 'Partial payment against invoice' })
  @IsOptional()
  @IsString()
  notes?: string;
}
