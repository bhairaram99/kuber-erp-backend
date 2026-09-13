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
import { PurchasesService } from './purchases.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionGuard } from '../common/guards/permission.guard';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PERMISSIONS } from '../common/constants/permissions.constant';

@ApiTags('Purchases')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('purchases')
export class PurchasesController {
  constructor(private readonly purchasesService: PurchasesService) {}

  @Get()
  @RequirePermission(PERMISSIONS.PURCHASES_VIEW)
  @ApiOperation({ summary: 'List purchase orders with pagination & filters' })
  @ApiQuery({ name: 'supplierId', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'paymentStatus', required: false })
  async findPaginated(
    @Query() query: PaginationQueryDto,
    @Query('supplierId') supplierId?: string,
    @Query('status') status?: string,
    @Query('paymentStatus') paymentStatus?: string,
  ) {
    return this.purchasesService.findPaginated(query, supplierId, status, paymentStatus);
  }

  @Get('recent')
  @RequirePermission(PERMISSIONS.PURCHASES_VIEW)
  @ApiOperation({ summary: 'Get recent confirmed purchase orders' })
  async getRecent(@Query('limit') limit?: number) {
    return this.purchasesService.getRecentPurchases(limit || 5);
  }

  @Get(':id')
  @RequirePermission(PERMISSIONS.PURCHASES_VIEW)
  @ApiOperation({ summary: 'Get purchase details and line items by ID' })
  async findById(@Param('id') id: string) {
    return this.purchasesService.findById(id);
  }

  @Post()
  @RequirePermission(PERMISSIONS.PURCHASES_CREATE)
  @ApiOperation({ summary: 'Create purchase order and increment stock/ledger' })
  async create(
    @Body() dto: CreatePurchaseDto,
    @CurrentUser('userId') userId: string,
  ) {
    return this.purchasesService.create(dto, userId);
  }
}
