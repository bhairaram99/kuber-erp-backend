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
import { SuppliersService } from './suppliers.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionGuard } from '../common/guards/permission.guard';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { PERMISSIONS } from '../common/constants/permissions.constant';

@ApiTags('Suppliers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Get()
  @RequirePermission(PERMISSIONS.SUPPLIERS_VIEW)
  @ApiOperation({ summary: 'List suppliers with pagination' })
  async findPaginated(
    @Query('all') all?: string,
    @Query() query?: PaginationQueryDto,
  ) {
    if (all === 'true' || query?.all === 'true' || String(all) === 'true' || String(query?.all) === 'true') {
      return this.suppliersService.findAll();
    }
    return this.suppliersService.findPaginated(query);
  }

  @Get(':id')
  @RequirePermission(PERMISSIONS.SUPPLIERS_VIEW)
  @ApiOperation({ summary: 'Get supplier details by ID' })
  async findById(@Param('id') id: string) {
    return this.suppliersService.findById(id);
  }

  @Post()
  @RequirePermission(PERMISSIONS.SUPPLIERS_CREATE)
  @ApiOperation({ summary: 'Create a new supplier' })
  async create(@Body() dto: CreateSupplierDto) {
    return this.suppliersService.create(dto);
  }

  @Patch(':id')
  @RequirePermission(PERMISSIONS.SUPPLIERS_UPDATE)
  @ApiOperation({ summary: 'Update supplier information' })
  async update(@Param('id') id: string, @Body() dto: UpdateSupplierDto) {
    return this.suppliersService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermission(PERMISSIONS.SUPPLIERS_DELETE)
  @ApiOperation({ summary: 'Delete a supplier' })
  async delete(@Param('id') id: string) {
    await this.suppliersService.delete(id);
    return { message: 'Supplier deleted successfully' };
  }
}
