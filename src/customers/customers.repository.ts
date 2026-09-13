import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { Customer, CustomerDocument } from './schemas/customer.schema';

@Injectable()
export class CustomersRepository {
  constructor(
    @InjectModel(Customer.name)
    private readonly customerModel: Model<CustomerDocument>,
  ) {}

  async findPaginated(
    filter: FilterQuery<CustomerDocument>,
    skip: number,
    limit: number,
    sortBy = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc',
  ): Promise<{ items: CustomerDocument[]; total: number }> {
    const sort: any = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    const [items, total] = await Promise.all([
      this.customerModel.find(filter).sort(sort).skip(skip).limit(limit).exec(),
      this.customerModel.countDocuments(filter).exec(),
    ]);

    return { items, total };
  }

  async findAll(filter: FilterQuery<CustomerDocument> = {}): Promise<CustomerDocument[]> {
    return this.customerModel.find(filter).sort({ name: 1 }).exec();
  }

  async findById(id: string): Promise<CustomerDocument | null> {
    return this.customerModel.findById(id).exec();
  }

  async findByCode(customerCode: string): Promise<CustomerDocument | null> {
    return this.customerModel.findOne({ customerCode: customerCode.toUpperCase() }).exec();
  }

  async create(data: Partial<Customer>): Promise<CustomerDocument> {
    const created = new this.customerModel(data);
    return created.save();
  }

  async update(id: string, data: Partial<Customer>): Promise<CustomerDocument | null> {
    return this.customerModel.findByIdAndUpdate(id, { $set: data }, { new: true }).exec();
  }

  async delete(id: string): Promise<CustomerDocument | null> {
    return this.customerModel.findByIdAndDelete(id).exec();
  }

  async count(): Promise<number> {
    return this.customerModel.countDocuments().exec();
  }

  async updateFinancials(
    id: string,
    purchaseDelta: number,
    paidDelta: number,
  ): Promise<CustomerDocument | null> {
    const customer = await this.customerModel.findById(id);
    if (!customer) return null;

    const newPurchases = Math.max(0, (customer.totalPurchases || 0) + purchaseDelta);
    const newPaid = Math.max(0, (customer.totalPaid || 0) + paidDelta);
    const newDue = Math.max(0, newPurchases - newPaid);

    return this.customerModel
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
