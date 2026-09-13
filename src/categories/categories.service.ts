import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { CategoriesRepository } from './categories.repository';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryDocument } from './schemas/category.schema';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly categoriesRepository: CategoriesRepository) {}

  async findAll(status?: string): Promise<CategoryDocument[]> {
    const filter: any = {};
    if (status) {
      filter.status = status;
    }
    return this.categoriesRepository.findAll(filter);
  }

  async findPaginated(query: PaginationQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (query.search) {
      filter.name = { $regex: query.search, $options: 'i' };
    }

    const { items, total } = await this.categoriesRepository.findPaginated(
      filter,
      skip,
      limit,
    );

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async findById(id: string): Promise<CategoryDocument> {
    const category = await this.categoriesRepository.findById(id);
    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
    return category;
  }

  async create(dto: CreateCategoryDto, userId?: string): Promise<CategoryDocument> {
    const existing = await this.categoriesRepository.findByName(dto.name);
    if (existing) {
      throw new ConflictException(`Category '${dto.name}' already exists`);
    }

    return this.categoriesRepository.create({
      ...dto,
      createdBy: userId,
      updatedBy: userId,
    });
  }

  async update(id: string, dto: UpdateCategoryDto, userId?: string): Promise<CategoryDocument> {
    const category = await this.findById(id);

    if (dto.name && dto.name.toLowerCase() !== category.name.toLowerCase()) {
      const existing = await this.categoriesRepository.findByName(dto.name);
      if (existing) {
        throw new ConflictException(`Category '${dto.name}' already exists`);
      }
    }

    return this.categoriesRepository.update(id, {
      ...dto,
      updatedBy: userId,
    });
  }

  async delete(id: string): Promise<void> {
    await this.findById(id);
    await this.categoriesRepository.delete(id);
  }

  async upsertCategory(name: string, description: string): Promise<CategoryDocument> {
    return this.categoriesRepository.upsert(name, {
      name,
      description,
      status: 'ACTIVE' as any,
    });
  }
}
