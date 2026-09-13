import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { TransactionsService } from './transactions.service';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionGuard } from '../common/guards/permission.guard';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { PERMISSIONS } from '../common/constants/permissions.constant';

@ApiTags('Transactions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  @RequirePermission(PERMISSIONS.TRANSACTIONS_VIEW)
  @ApiOperation({ summary: 'Get unified business transactions ledger' })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'customerId', required: false })
  @ApiQuery({ name: 'supplierId', required: false })
  async findPaginated(
    @Query() query: PaginationQueryDto,
    @Query('type') type?: string,
    @Query('customerId') customerId?: string,
    @Query('supplierId') supplierId?: string,
  ) {
    return this.transactionsService.findPaginated(query, type, customerId, supplierId);
  }

  @Get('recent')
  @RequirePermission(PERMISSIONS.TRANSACTIONS_VIEW)
  @ApiOperation({ summary: 'Get recent central transactions' })
  async getRecent(@Query('limit') limit?: number) {
    return this.transactionsService.getRecent(limit || 8);
  }

  @Get(':id')
  @RequirePermission(PERMISSIONS.TRANSACTIONS_VIEW)
  @ApiOperation({ summary: 'Get transaction details by ID' })
  async findById(@Param('id') id: string) {
    return this.transactionsService.findById(id);
  }
}
