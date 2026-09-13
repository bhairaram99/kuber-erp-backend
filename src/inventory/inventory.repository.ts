import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import {
  InventoryTransaction,
  InventoryTransactionDocument,
} from './schemas/inventory-transaction.schema';

@Injectable()
export class InventoryRepository {
  constructor(
    @InjectModel(InventoryTransaction.name)
    private readonly transactionModel: Model<InventoryTransactionDocument>,
  ) {}

  async create(data: Partial<InventoryTransaction>): Promise<InventoryTransactionDocument> {
    const created = new this.transactionModel(data);
    return created.save();
  }

  async findPaginated(
    filter: FilterQuery<InventoryTransactionDocument>,
    skip: number,
    limit: number,
  ): Promise<{ items: InventoryTransactionDocument[]; total: number }> {
    const [items, total] = await Promise.all([
      this.transactionModel
        .find(filter)
        .populate('productId', 'name sku unit woodType')
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.transactionModel.countDocuments(filter).exec(),
    ]);

    return { items, total };
  }

  async findByProductId(productId: string, limit = 50): Promise<InventoryTransactionDocument[]> {
    return this.transactionModel
      .find({ productId })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }

  async getRecentMovements(limit = 10): Promise<InventoryTransactionDocument[]> {
    return this.transactionModel
      .find()
      .populate('productId', 'name sku unit woodType')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }
}
