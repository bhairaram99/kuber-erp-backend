import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { ReportQueryDto } from './dto/report-query.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionGuard } from '../common/guards/permission.guard';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { PERMISSIONS } from '../common/constants/permissions.constant';

@ApiTags('Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('dashboard')
  @RequirePermission(PERMISSIONS.DASHBOARD_VIEW)
  @ApiOperation({ summary: 'Get aggregated dashboard summary KPIs and trends' })
  async getDashboardSummary(@Query() query: ReportQueryDto) {
    return this.reportsService.getDashboardSummary(query.days);
  }

  @Get('profit-loss')
  @RequirePermission(PERMISSIONS.REPORTS_VIEW)
  @ApiOperation({ summary: 'Get Profit and Loss report (Revenue, COGS, Gross & Net Profit)' })
  async getProfitAndLoss(@Query() query: ReportQueryDto) {
    return this.reportsService.getProfitAndLoss(query);
  }

  @Get('sales')
  @RequirePermission(PERMISSIONS.REPORTS_VIEW)
  @ApiOperation({ summary: 'Get sales analytics and product performance report' })
  async getSalesReport(@Query() query: ReportQueryDto) {
    return this.reportsService.getSalesReport(query);
  }

  @Get('purchases')
  @RequirePermission(PERMISSIONS.REPORTS_VIEW)
  @ApiOperation({ summary: 'Get procurement and supplier spend report' })
  async getPurchasesReport(@Query() query: ReportQueryDto) {
    return this.reportsService.getPurchasesReport(query);
  }

  @Get('inventory')
  @RequirePermission(PERMISSIONS.REPORTS_VIEW)
  @ApiOperation({ summary: 'Get current inventory valuation and stock health report' })
  async getInventoryReport() {
    return this.reportsService.getInventoryReport();
  }
}
