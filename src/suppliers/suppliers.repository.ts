import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { Supplier, SupplierDocument } from './schemas/supplier.schema';

@Injectable()
export class SuppliersRepository {
  constructor(
    @InjectModel(Supplier.name)
    private readonly supplierModel: Model<SupplierDocument>,
  ) {}

  async findPaginated(
    filter: FilterQuery<SupplierDocument>,
    skip: number,
    limit: number,
    sortBy = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc',
  ): Promise<{ items: SupplierDocument[]; total: number }> {
    const sort: any = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    const [items, total] = await Promise.all([
      this.supplierModel.find(filter).sort(sort).skip(skip).limit(limit).exec(),
      this.supplierModel.countDocuments(filter).exec(),
    ]);

    return { items, total };
  }

  async findAll(filter: FilterQuery<SupplierDocument> = {}): Promise<SupplierDocument[]> {
    return this.supplierModel.find(filter).sort({ name: 1 }).exec();
  }

  async findById(id: string): Promise<SupplierDocument | null> {
    return this.supplierModel.findById(id).exec();
  }

  async findByCode(supplierCode: string): Promise<SupplierDocument | null> {
    return this.supplierModel.findOne({ supplierCode: supplierCode.toUpperCase() }).exec();
  }

  async create(data: Partial<Supplier>): Promise<SupplierDocument> {
    const created = new this.supplierModel(data);
    return created.save();
  }

  async update(id: string, data: Partial<Supplier>): Promise<SupplierDocument | null> {
    return this.supplierModel.findByIdAndUpdate(id, { $set: data }, { new: true }).exec();
  }

  async delete(id: string): Promise<SupplierDocument | null> {
    return this.supplierModel.findByIdAndDelete(id).exec();
  }

  async count(): Promise<number> {
    return this.supplierModel.countDocuments().exec();
  }

  async updateFinancials(
    id: string,
    purchaseDelta: number,
    paidDelta: number,
  ): Promise<SupplierDocument | null> {
    const supplier = await this.supplierModel.findById(id);
    if (!supplier) return null;

    const newPurchases = Math.max(0, (supplier.totalPurchases || 0) + purchaseDelta);
    const newPaid = Math.max(0, (supplier.totalPaid || 0) + paidDelta);
    const newDue = Math.max(0, newPurchases - newPaid);

    return this.supplierModel
      .findByIdAndUpdate(
        id,
        {
          $set: {
            totalPurchases: newPurchases,
            totalPaid: newPaid,
            totalDue: newDue,
          },
        },
        { new: true },
      )
      .exec();
  }
}
