import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { ResetStockDto } from './dto/reset-stock.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionGuard } from '../common/guards/permission.guard';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PERMISSIONS } from '../common/constants/permissions.constant';

@ApiTags('Inventory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('history')
  @RequirePermission(PERMISSIONS.INVENTORY_HISTORY)
  @ApiOperation({ summary: 'Get paginated inventory movements and transaction log' })
  @ApiQuery({ name: 'productId', required: false })
  @ApiQuery({ name: 'type', required: false })
  async getHistory(
    @Query() query: PaginationQueryDto,
    @Query('productId') productId?: string,
    @Query('type') type?: string,
  ) {
    return this.inventoryService.getHistory(query, productId, type);
  }

  @Get('recent')
  @RequirePermission(PERMISSIONS.INVENTORY_VIEW)
  @ApiOperation({ summary: 'Get recent inventory movements' })
  async getRecentMovements(@Query('limit') limit?: number) {
    return this.inventoryService.getRecentMovements(limit || 10);
  }

  @Post('adjust')
  @RequirePermission(PERMISSIONS.INVENTORY_ADJUST)
  @ApiOperation({ summary: 'Manually adjust stock quantity with reason & log' })
  async adjustStock(
    @Body() dto: AdjustStockDto,
    @CurrentUser('userId') userId: string,
  ) {
    return this.inventoryService.adjustStock(dto, userId);
  }

  @Post('reset')
  @RequirePermission(PERMISSIONS.INVENTORY_RESET)
  @ApiOperation({ summary: 'Reset stock level to a baseline (sensitive operation)' })
  async resetStock(
    @Body() dto: ResetStockDto,
    @CurrentUser('userId') userId: string,
  ) {
    return this.inventoryService.resetStock(dto, userId);
  }
}
