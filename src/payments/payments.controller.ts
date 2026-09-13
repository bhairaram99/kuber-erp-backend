import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionGuard } from '../common/guards/permission.guard';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PERMISSIONS } from '../common/constants/permissions.constant';

@ApiTags('Payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  @RequirePermission(PERMISSIONS.PAYMENTS_VIEW)
  @ApiOperation({ summary: 'List payments with pagination' })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'customerId', required: false })
  @ApiQuery({ name: 'supplierId', required: false })
  async findPaginated(
    @Query() query: PaginationQueryDto,
    @Query('type') type?: string,
    @Query('customerId') customerId?: string,
    @Query('supplierId') supplierId?: string,
  ) {
    return this.paymentsService.findPaginated(query, type, customerId, supplierId);
  }

  @Get(':id')
  @RequirePermission(PERMISSIONS.PAYMENTS_VIEW)
  @ApiOperation({ summary: 'Get payment details by ID' })
  async findById(@Param('id') id: string) {
    return this.paymentsService.findById(id);
  }

  @Post()
  @RequirePermission(PERMISSIONS.PAYMENTS_CREATE)
  @ApiOperation({ summary: 'Record customer receipt or supplier payment' })
  async create(
    @Body() dto: CreatePaymentDto,
    @CurrentUser('userId') userId: string,
  ) {
    return this.paymentsService.create(dto, userId);
  }
}
