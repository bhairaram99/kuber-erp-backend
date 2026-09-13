import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionGuard } from '../common/guards/permission.guard';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PERMISSIONS } from '../common/constants/permissions.constant';

@ApiTags('Sales')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Get()
  @RequirePermission(PERMISSIONS.SALES_VIEW)
  @ApiOperation({ summary: 'List sales invoices with pagination & filters' })
  @ApiQuery({ name: 'customerId', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'paymentStatus', required: false })
  async findPaginated(
    @Query() query: PaginationQueryDto,
    @Query('customerId') customerId?: string,
    @Query('status') status?: string,
    @Query('paymentStatus') paymentStatus?: string,
  ) {
    return this.salesService.findPaginated(query, customerId, status, paymentStatus);
  }

  @Get('recent')
  @RequirePermission(PERMISSIONS.SALES_VIEW)
  @ApiOperation({ summary: 'Get recent confirmed sales' })
  async getRecent(@Query('limit') limit?: number) {
    return this.salesService.getRecentSales(limit || 5);
  }

  @Get(':id')
  @RequirePermission(PERMISSIONS.SALES_VIEW)
  @ApiOperation({ summary: 'Get sale details and line items by ID' })
  async findById(@Param('id') id: string) {
    return this.salesService.findById(id);
  }

  @Post()
  @RequirePermission(PERMISSIONS.SALES_CREATE)
  @ApiOperation({ summary: 'Create a sale invoice and update stock/ledger' })
  async create(
    @Body() dto: CreateSaleDto,
    @CurrentUser('userId') userId: string,
  ) {
    return this.salesService.create(dto, userId);
  }

  @Post(':id/cancel')
  @RequirePermission(PERMISSIONS.SALES_CANCEL)
  @ApiOperation({ summary: 'Cancel sale invoice and restore stock' })
  async cancel(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
  ) {
    return this.salesService.cancelSale(id, userId);
  }
}
