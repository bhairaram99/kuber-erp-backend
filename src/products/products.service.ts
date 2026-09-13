import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  Optional,
} from '@nestjs/common';
import { ProductsRepository } from './products.repository';
import { CategoriesService } from '../categories/categories.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { ProductDocument } from './schemas/product.schema';

@Injectable()
export class ProductsService {
  constructor(
    private readonly productsRepository: ProductsRepository,
    private readonly categoriesService: CategoriesService,
    @Optional() private readonly auditLogsService?: AuditLogsService,
  ) {}

  async findPaginated(
    query: PaginationQueryDto,
    categoryId?: string,
    woodType?: string,
    stockStatus?: 'in_stock' | 'low_stock' | 'out_of_stock',
  ) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter: any = {};

    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { sku: { $regex: query.search, $options: 'i' } },
        { woodType: { $regex: query.search, $options: 'i' } },
        { brand: { $regex: query.search, $options: 'i' } },
        { location: { $regex: query.search, $options: 'i' } },
      ];
    }

    if (categoryId) {
      filter.categoryId = categoryId;
    }

    if (woodType) {
      filter.woodType = new RegExp(`^${woodType}$`, 'i');
    }

    if (stockStatus === 'in_stock') {
      filter.currentStock = { $gt: 0 };
    } else if (stockStatus === 'low_stock') {
      filter.$expr = {
        $and: [
          { $gt: ['$currentStock', 0] },
          { $lte: ['$currentStock', '$minimumStock'] },
        ],
      };
    } else if (stockStatus === 'out_of_stock') {
      filter.currentStock = { $lte: 0 };
    }

    const { items, total } = await this.productsRepository.findPaginated(
      filter,
      skip,
      limit,
      query.sortBy || 'createdAt',
      query.sortOrder || 'desc',
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

  async findAll(filter: any = {}): Promise<ProductDocument[]> {
    return this.productsRepository.findAll(filter);
  }

  async findById(id: string): Promise<ProductDocument> {
    const product = await this.productsRepository.findById(id);
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return product;
  }

  async findBySku(sku: string): Promise<ProductDocument | null> {
    return this.productsRepository.findBySku(sku);
  }

  async create(dto: CreateProductDto, userId?: string): Promise<ProductDocument> {
    const existingSku = await this.productsRepository.findBySku(dto.sku);
    if (existingSku) {
      throw new ConflictException(`Product with SKU '${dto.sku}' already exists`);
    }

    if (dto.barcode) {
      const existingBarcode = await this.productsRepository.findByBarcode(dto.barcode);
      if (existingBarcode) {
        throw new ConflictException(`Product with Barcode '${dto.barcode}' already exists`);
      }
    }

    await this.categoriesService.findById(dto.categoryId);

    const initialStock = dto.openingStock ?? 0;

    const product = await this.productsRepository.create({
      ...dto,
      sku: dto.sku.toUpperCase(),
      currentStock: initialStock,
      createdBy: userId,
      updatedBy: userId,
    });

    if (this.auditLogsService) {
      await this.auditLogsService.log({
        userId,
        action: 'CREATE',
        module: 'PRODUCTS',
        entityType: 'Product',
        entityId: product._id.toString(),
        newData: product,
      });
    }

    return product;
  }

  async update(id: string, dto: UpdateProductDto, userId?: string): Promise<ProductDocument> {
    const product = await this.findById(id);

    if (dto.sku && dto.sku.toUpperCase() !== product.sku) {
      const existingSku = await this.productsRepository.findBySku(dto.sku);
      if (existingSku) {
        throw new ConflictException(`Product with SKU '${dto.sku}' already exists`);
      }
    }

    if (dto.categoryId) {
      await this.categoriesService.findById(dto.categoryId);
    }

    const updateData: any = {
      ...dto,
      sku: dto.sku ? dto.sku.toUpperCase() : product.sku,
      updatedBy: userId,
    };

    // Prevent direct raw stock modification here (must use Inventory adjustment)
    delete updateData.currentStock;

    return this.productsRepository.update(id, updateData);
  }

  async delete(id: string): Promise<void> {
    await this.findById(id);
    await this.productsRepository.delete(id);
  }

  async atomicUpdateStock(
    id: string,
    delta: number,
    allowNegative = false,
  ): Promise<ProductDocument> {
    const updated = await this.productsRepository.atomicUpdateStock(id, delta, allowNegative);
    if (!updated) {
      throw new BadRequestException(
        `Insufficient stock for product. Cannot decrease by ${Math.abs(delta)}.`,
      );
    }
    return updated;
  }

  async atomicSetStock(id: string, newStock: number): Promise<ProductDocument> {
    const updated = await this.productsRepository.atomicSetStock(id, newStock);
    if (!updated) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return updated;
  }

  async getMetrics() {
    const [lowStockCount, val] = await Promise.all([
      this.productsRepository.getLowStockCount(),
      this.productsRepository.getTotalStockValue(),
    ]);

    return {
      lowStockCount,
      totalStockValue: val.totalValue,
      totalUnits: val.totalUnits,
    };
  }
}
