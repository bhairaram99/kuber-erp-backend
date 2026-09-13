import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InventoryRepository } from './inventory.repository';
import { ProductsService } from '../products/products.service';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { ResetStockDto } from './dto/reset-stock.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { InventoryTransactionType } from '../common/enums/inventory-transaction-type.enum';

@Injectable()
export class InventoryService {
  constructor(
    private readonly inventoryRepository: InventoryRepository,
    private readonly productsService: ProductsService,
  ) {}

  async adjustStock(dto: AdjustStockDto, userId: string) {
    const product = await this.productsService.findById(dto.productId);

    // Determine signed delta with whole number integrity
    const quantity = Math.max(1, Math.round(Math.abs(dto.quantity)));
    let delta = quantity;
    const negativeTypes = [
      InventoryTransactionType.ADJUSTMENT_OUT,
      InventoryTransactionType.DAMAGE,
      InventoryTransactionType.LOSS,
    ];

    if (negativeTypes.includes(dto.type)) {
      delta = -delta;
    }

    const previousStock = Math.round(product.currentStock);
    if (delta < 0 && previousStock + delta < 0) {
      throw new BadRequestException(
        `Cannot reduce stock by ${Math.abs(delta)}. Current stock is only ${previousStock}.`,
      );
    }

    // Atomic update
    const updatedProduct = await this.productsService.atomicUpdateStock(
      dto.productId,
      delta,
    );

    const transaction = await this.inventoryRepository.create({
      productId: dto.productId,
      type: dto.type,
      quantity: delta,
      previousStock,
      newStock: Math.round(updatedProduct.currentStock),
      referenceType: 'MANUAL_ADJUSTMENT',
      reason: dto.reason,
      notes: dto.notes || '',
      createdBy: userId,
    });

    return {
      product: updatedProduct,
      transaction,
    };
  }

  async resetStock(dto: ResetStockDto, userId: string) {
    const product = await this.productsService.findById(dto.productId);
    const previousStock = Math.round(product.currentStock);
    const newStock = Math.max(0, Math.round(dto.newStock));
    const delta = newStock - previousStock;

    const updatedProduct = await this.productsService.atomicSetStock(
      dto.productId,
      newStock,
    );

    const transaction = await this.inventoryRepository.create({
      productId: dto.productId,
      type: InventoryTransactionType.RESET,
      quantity: delta,
      previousStock,
      newStock: Math.round(updatedProduct.currentStock),
      referenceType: 'STOCK_RESET',
      reason: dto.reason,
      notes: dto.notes || '',
      createdBy: userId,
    });

    return {
      product: updatedProduct,
      transaction,
    };
  }

  async recordTransaction(data: {
    productId: string;
    type: InventoryTransactionType;
    quantity: number;
    previousStock: number;
    newStock: number;
    referenceType: string;
    referenceId?: string;
    reason?: string;
    notes?: string;
    createdBy?: string;
  }) {
    return this.inventoryRepository.create({
      ...data,
      quantity: Math.round(data.quantity),
      previousStock: Math.round(data.previousStock),
      newStock: Math.round(data.newStock),
    });
  }

  async getHistory(
    query: PaginationQueryDto,
    productId?: string,
    type?: string,
  ) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (productId) {
      filter.productId = productId;
    }
    if (type) {
      filter.type = type;
    }
    if (query.from || query.to) {
      filter.createdAt = {};
      if (query.from) {
        filter.createdAt.$gte = new Date(query.from);
      }
      if (query.to) {
        filter.createdAt.$lte = new Date(query.to);
      }
    }

    const { items, total } = await this.inventoryRepository.findPaginated(
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

  async getRecentMovements(limit = 10) {
    return this.inventoryRepository.getRecentMovements(limit);
  }
}
