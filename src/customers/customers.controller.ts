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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionGuard } from '../common/guards/permission.guard';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { PERMISSIONS } from '../common/constants/permissions.constant';

@ApiTags('Customers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  @RequirePermission(PERMISSIONS.CUSTOMERS_VIEW)
  @ApiOperation({ summary: 'List customers with pagination' })
  async findPaginated(
    @Query('all') all?: string,
    @Query() query?: PaginationQueryDto,
  ) {
    if (all === 'true' || query?.all === 'true' || String(all) === 'true' || String(query?.all) === 'true') {
      return this.customersService.findAll();
    }
    return this.customersService.findPaginated(query);
  }

  @Get(':id')
  @RequirePermission(PERMISSIONS.CUSTOMERS_VIEW)
  @ApiOperation({ summary: 'Get customer details by ID' })
  async findById(@Param('id') id: string) {
    return this.customersService.findById(id);
  }

  @Post()
  @RequirePermission(PERMISSIONS.CUSTOMERS_CREATE)
  @ApiOperation({ summary: 'Create a new customer' })
  async create(@Body() dto: CreateCustomerDto) {
    return this.customersService.create(dto);
  }

  @Patch(':id')
  @RequirePermission(PERMISSIONS.CUSTOMERS_UPDATE)
  @ApiOperation({ summary: 'Update customer information' })
  async update(@Param('id') id: string, @Body() dto: UpdateCustomerDto) {
    return this.customersService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermission(PERMISSIONS.CUSTOMERS_DELETE)
  @ApiOperation({ summary: 'Delete a customer' })
  async delete(@Param('id') id: string) {
    await this.customersService.delete(id);
    return { message: 'Customer deleted successfully' };
  }
}
