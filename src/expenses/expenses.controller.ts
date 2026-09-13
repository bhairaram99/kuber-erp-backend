import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionGuard } from '../common/guards/permission.guard';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PERMISSIONS } from '../common/constants/permissions.constant';

@ApiTags('Expenses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Get()
  @RequirePermission(PERMISSIONS.EXPENSES_VIEW)
  @ApiOperation({ summary: 'List expenses with pagination & filters' })
  @ApiQuery({ name: 'category', required: false })
  async findPaginated(
    @Query() query: PaginationQueryDto,
    @Query('category') category?: string,
  ) {
    return this.expensesService.findPaginated(query, category);
  }

  @Get('breakdown')
  @RequirePermission(PERMISSIONS.EXPENSES_VIEW)
  @ApiOperation({ summary: 'Get category-wise expense breakdown' })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  async getCategoryBreakdown(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.expensesService.getCategoryBreakdown(from, to);
  }

  @Get(':id')
  @RequirePermission(PERMISSIONS.EXPENSES_VIEW)
  @ApiOperation({ summary: 'Get expense by ID' })
  async findById(@Param('id') id: string) {
    return this.expensesService.findById(id);
  }

  @Post()
  @RequirePermission(PERMISSIONS.EXPENSES_CREATE)
  @ApiOperation({ summary: 'Record a business expense' })
  async create(
    @Body() dto: CreateExpenseDto,
    @CurrentUser('userId') userId: string,
  ) {
    return this.expensesService.create(dto, userId);
  }

  @Patch(':id')
  @RequirePermission(PERMISSIONS.EXPENSES_UPDATE)
  @ApiOperation({ summary: 'Update an expense' })
  async update(@Param('id') id: string, @Body() dto: UpdateExpenseDto) {
    return this.expensesService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermission(PERMISSIONS.EXPENSES_DELETE)
  @ApiOperation({ summary: 'Delete an expense' })
  async delete(@Param('id') id: string) {
    await this.expensesService.delete(id);
    return { message: 'Expense deleted successfully' };
  }
}
