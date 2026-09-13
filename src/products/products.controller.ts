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
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionGuard } from '../common/guards/permission.guard';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PERMISSIONS } from '../common/constants/permissions.constant';

@ApiTags('Products')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @RequirePermission(PERMISSIONS.PRODUCTS_VIEW)
  @ApiOperation({ summary: 'List products with filters and pagination' })
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiQuery({ name: 'woodType', required: false })
  @ApiQuery({ name: 'stockStatus', required: false, enum: ['in_stock', 'low_stock', 'out_of_stock'] })
  async findPaginated(
    @Query() query: PaginationQueryDto,
    @Query('categoryId') categoryId?: string,
    @Query('woodType') woodType?: string,
    @Query('stockStatus') stockStatus?: 'in_stock' | 'low_stock' | 'out_of_stock',
  ) {
    return this.productsService.findPaginated(query, categoryId, woodType, stockStatus);
  }

  @Get('metrics')
  @RequirePermission(PERMISSIONS.PRODUCTS_VIEW)
  @ApiOperation({ summary: 'Get product stock valuation and low stock count' })
  async getMetrics() {
    return this.productsService.getMetrics();
  }

  @Get(':id')
  @RequirePermission(PERMISSIONS.PRODUCTS_VIEW)
  @ApiOperation({ summary: 'Get product details by ID' })
  async findById(@Param('id') id: string) {
    return this.productsService.findById(id);
  }

  @Post()
  @RequirePermission(PERMISSIONS.PRODUCTS_CREATE)
  @ApiOperation({ summary: 'Create a new product' })
  async create(@Body() dto: CreateProductDto, @CurrentUser('userId') userId: string) {
    return this.productsService.create(dto, userId);
  }

  @Patch(':id')
  @RequirePermission(PERMISSIONS.PRODUCTS_UPDATE)
  @ApiOperation({ summary: 'Update product information' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
    @CurrentUser('userId') userId: string,
  ) {
    return this.productsService.update(id, dto, userId);
  }

  @Delete(':id')
  @RequirePermission(PERMISSIONS.PRODUCTS_DELETE)
  @ApiOperation({ summary: 'Delete a product' })
  async delete(@Param('id') id: string) {
    await this.productsService.delete(id);
    return { message: 'Product deleted successfully' };
  }
}
