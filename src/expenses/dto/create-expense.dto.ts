import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { PaymentMethod } from '../../common/enums/payment.enum';

export class CreateExpenseDto {
  @ApiProperty({ example: 'Warehouse Yard Rent for September' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ example: 'Rent & Yard Lease' })
  @IsNotEmpty()
  @IsString()
  category: string;

  @ApiProperty({ example: 25000 })
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiPropertyOptional({ example: '2026-09-01' })
  @IsOptional()
  @IsString()
  date?: string;

  @ApiPropertyOptional({ enum: PaymentMethod, default: PaymentMethod.BANK_TRANSFER })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod = PaymentMethod.BANK_TRANSFER;

  @ApiPropertyOptional({ example: 'Monthly yard lease paid to GIDC' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'Ramesh Sharma' })
  @IsOptional()
  @IsString()
  paidBy?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  receipt?: string;
}
