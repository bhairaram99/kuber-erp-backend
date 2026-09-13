import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import {
  CentralTransaction,
  CentralTransactionDocument,
} from './schemas/central-transaction.schema';

@Injectable()
export class TransactionsRepository {
  constructor(
    @InjectModel(CentralTransaction.name)
    private readonly transactionModel: Model<CentralTransactionDocument>,
  ) {}

  async create(data: Partial<CentralTransaction>): Promise<CentralTransactionDocument> {
    const created = new this.transactionModel(data);
    return created.save();
  }

  async findPaginated(
    filter: FilterQuery<CentralTransactionDocument>,
    skip: number,
    limit: number,
    sortBy = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc',
  ): Promise<{ items: CentralTransactionDocument[]; total: number }> {
    const sort: any = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    const [items, total] = await Promise.all([
      this.transactionModel
        .find(filter)
        .populate('customerId', 'name company phone')
        .populate('supplierId', 'name company phone')
        .populate('createdBy', 'name')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.transactionModel.countDocuments(filter).exec(),
    ]);

    return { items, total };
  }

  async findById(id: string): Promise<CentralTransactionDocument | null> {
    return this.transactionModel
      .findById(id)
      .populate('customerId')
      .populate('supplierId')
      .populate('createdBy', 'name email')
      .exec();
  }

  async count(): Promise<number> {
    return this.transactionModel.countDocuments().exec();
  }

  async getRecent(limit = 8): Promise<CentralTransactionDocument[]> {
    return this.transactionModel
      .find()
      .populate('customerId', 'name company')
      .populate('supplierId', 'name company')
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }
}
