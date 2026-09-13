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
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionGuard } from '../common/guards/permission.guard';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PERMISSIONS } from '../common/constants/permissions.constant';

@ApiTags('Categories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @RequirePermission(PERMISSIONS.CATEGORIES_VIEW)
  @ApiOperation({ summary: 'List all categories or paginated categories' })
  async findAll(@Query('all') all?: string, @Query() query?: PaginationQueryDto) {
    if (all === 'true' || query?.all === 'true' || String(all) === 'true' || String(query?.all) === 'true') {
      return this.categoriesService.findAll();
    }
    return this.categoriesService.findPaginated(query);
  }

  @Get(':id')
  @RequirePermission(PERMISSIONS.CATEGORIES_VIEW)
  @ApiOperation({ summary: 'Get category by ID' })
  async findById(@Param('id') id: string) {
    return this.categoriesService.findById(id);
  }

  @Post()
  @RequirePermission(PERMISSIONS.CATEGORIES_CREATE)
  @ApiOperation({ summary: 'Create a new category' })
  async create(@Body() dto: CreateCategoryDto, @CurrentUser('userId') userId: string) {
    return this.categoriesService.create(dto, userId);
  }

  @Patch(':id')
  @RequirePermission(PERMISSIONS.CATEGORIES_UPDATE)
  @ApiOperation({ summary: 'Update a category' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
    @CurrentUser('userId') userId: string,
  ) {
    return this.categoriesService.update(id, dto, userId);
  }

  @Delete(':id')
  @RequirePermission(PERMISSIONS.CATEGORIES_DELETE)
  @ApiOperation({ summary: 'Delete a category' })
  async delete(@Param('id') id: string) {
    await this.categoriesService.delete(id);
    return { message: 'Category deleted successfully' };
  }
}
