import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { Sale, SaleDocument } from './schemas/sale.schema';

@Injectable()
export class SalesRepository {
  constructor(
    @InjectModel(Sale.name)
    private readonly saleModel: Model<SaleDocument>,
  ) {}

  async findPaginated(
    filter: FilterQuery<SaleDocument>,
    skip: number,
    limit: number,
    sortBy = 'saleDate',
    sortOrder: 'asc' | 'desc' = 'desc',
  ): Promise<{ items: SaleDocument[]; total: number }> {
    const sort: any = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    const [items, total] = await Promise.all([
      this.saleModel
        .find(filter)
        .populate('customerId', 'name phone company customerCode')
        .populate('createdBy', 'name')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.saleModel.countDocuments(filter).exec(),
    ]);

    return { items, total };
  }

  async findById(id: string): Promise<SaleDocument | null> {
    return this.saleModel
      .findById(id)
      .populate('customerId')
      .populate('createdBy', 'name email')
      .exec();
  }

  async findByInvoiceNumber(invoiceNumber: string): Promise<SaleDocument | null> {
    return this.saleModel.findOne({ invoiceNumber: invoiceNumber.toUpperCase() }).exec();
  }

  async create(data: Partial<Sale>): Promise<SaleDocument> {
    const created = new this.saleModel(data);
    return created.save();
  }

  async update(id: string, data: Partial<Sale>): Promise<SaleDocument | null> {
    return this.saleModel.findByIdAndUpdate(id, { $set: data }, { new: true }).exec();
  }

  async count(): Promise<number> {
    return this.saleModel.countDocuments().exec();
  }

  async getRecentSales(limit = 5): Promise<SaleDocument[]> {
    return this.saleModel
      .find({ status: 'CONFIRMED' })
      .populate('customerId', 'name company')
      .sort({ saleDate: -1 })
      .limit(limit)
      .exec();
  }
}
