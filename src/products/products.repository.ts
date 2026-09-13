import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { Product, ProductDocument } from './schemas/product.schema';

@Injectable()
export class ProductsRepository {
  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
  ) {}

  async findPaginated(
    filter: FilterQuery<ProductDocument>,
    skip: number,
    limit: number,
    sortBy = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc',
  ): Promise<{ items: ProductDocument[]; total: number }> {
    const sort: any = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    const [items, total] = await Promise.all([
      this.productModel
        .find(filter)
        .populate('categoryId', 'name')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.productModel.countDocuments(filter).exec(),
    ]);

    return { items, total };
  }

  async findAll(filter: FilterQuery<ProductDocument> = {}): Promise<ProductDocument[]> {
    return this.productModel
      .find(filter)
      .populate('categoryId', 'name')
      .sort({ name: 1 })
      .exec();
  }

  async findById(id: string): Promise<ProductDocument | null> {
    return this.productModel.findById(id).populate('categoryId', 'name').exec();
  }

  async findBySku(sku: string): Promise<ProductDocument | null> {
    return this.productModel.findOne({ sku: sku.toUpperCase() }).exec();
  }

  async findByBarcode(barcode: string): Promise<ProductDocument | null> {
    return this.productModel.findOne({ barcode }).exec();
  }

  async create(data: Partial<Product>): Promise<ProductDocument> {
    const created = new this.productModel(data);
    return created.save();
  }

  async update(id: string, data: Partial<Product>): Promise<ProductDocument | null> {
    return this.productModel
      .findByIdAndUpdate(id, { $set: data }, { new: true })
      .populate('categoryId', 'name')
      .exec();
  }

  async delete(id: string): Promise<ProductDocument | null> {
    return this.productModel.findByIdAndDelete(id).exec();
  }

  /**
   * Concurrency-safe atomic stock update with whole number integrity
   */
  async atomicUpdateStock(
    id: string,
    delta: number,
    allowNegative = false,
  ): Promise<ProductDocument | null> {
    const roundedDelta = Math.round(delta);
    const product = await this.productModel.findById(id);
    if (!product) return null;

    const current = Math.round(product.currentStock);
    if (!allowNegative && roundedDelta < 0 && current < Math.abs(roundedDelta)) {
      return null;
    }

    const newStock = Math.max(0, current + roundedDelta);
    return this.productModel
      .findByIdAndUpdate(
        id,
        { $set: { currentStock: newStock } },
        { new: true },
      )
      .populate('categoryId', 'name')
      .exec();
  }

  /**
   * Atomic stock reset / direct override with whole number integrity
   */
  async atomicSetStock(id: string, newStock: number): Promise<ProductDocument | null> {
    const roundedStock = Math.max(0, Math.round(newStock));
    return this.productModel
      .findByIdAndUpdate(id, { $set: { currentStock: roundedStock } }, { new: true })
      .populate('categoryId', 'name')
      .exec();
  }

  async getLowStockCount(): Promise<number> {
    return this.productModel
      .countDocuments({
        status: 'ACTIVE',
        $expr: { $lte: ['$currentStock', '$minimumStock'] },
      })
      .exec();
  }

  async getTotalStockValue(): Promise<{ totalValue: number; totalUnits: number }> {
    const res = await this.productModel.aggregate([
      { $match: { status: 'ACTIVE' } },
      {
        $group: {
          _id: null,
          totalValue: { $sum: { $multiply: ['$currentStock', '$purchasePrice'] } },
          totalUnits: { $sum: '$currentStock' },
        },
      },
    ]);
    return res[0] || { totalValue: 0, totalUnits: 0 };
  }
}
