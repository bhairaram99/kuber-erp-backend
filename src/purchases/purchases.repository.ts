import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { Purchase, PurchaseDocument } from './schemas/purchase.schema';

@Injectable()
export class PurchasesRepository {
  constructor(
    @InjectModel(Purchase.name)
    private readonly purchaseModel: Model<PurchaseDocument>,
  ) {}

  async findPaginated(
    filter: FilterQuery<PurchaseDocument>,
    skip: number,
    limit: number,
    sortBy = 'purchaseDate',
    sortOrder: 'asc' | 'desc' = 'desc',
  ): Promise<{ items: PurchaseDocument[]; total: number }> {
    const sort: any = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    const [items, total] = await Promise.all([
      this.purchaseModel
        .find(filter)
        .populate('supplierId', 'name company phone supplierCode')
        .populate('createdBy', 'name')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.purchaseModel.countDocuments(filter).exec(),
    ]);

    return { items, total };
  }

  async findById(id: string): Promise<PurchaseDocument | null> {
    return this.purchaseModel
      .findById(id)
      .populate('supplierId')
      .populate('createdBy', 'name email')
      .exec();
  }

  async findByPurchaseNumber(purchaseNumber: string): Promise<PurchaseDocument | null> {
    return this.purchaseModel.findOne({ purchaseNumber: purchaseNumber.toUpperCase() }).exec();
  }

  async create(data: Partial<Purchase>): Promise<PurchaseDocument> {
    const created = new this.purchaseModel(data);
    return created.save();
  }

  async update(id: string, data: Partial<Purchase>): Promise<PurchaseDocument | null> {
    return this.purchaseModel.findByIdAndUpdate(id, { $set: data }, { new: true }).exec();
  }

  async count(): Promise<number> {
    return this.purchaseModel.countDocuments().exec();
  }

  async getRecentPurchases(limit = 5): Promise<PurchaseDocument[]> {
    return this.purchaseModel
      .find({ status: 'CONFIRMED' })
      .populate('supplierId', 'name company')
      .sort({ purchaseDate: -1 })
      .limit(limit)
      .exec();
  }
}
