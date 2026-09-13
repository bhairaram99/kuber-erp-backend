import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { Payment, PaymentDocument } from './schemas/payment.schema';

@Injectable()
export class PaymentsRepository {
  constructor(
    @InjectModel(Payment.name)
    private readonly paymentModel: Model<PaymentDocument>,
  ) {}

  async create(data: Partial<Payment>): Promise<PaymentDocument> {
    const created = new this.paymentModel(data);
    return created.save();
  }

  async findPaginated(
    filter: FilterQuery<PaymentDocument>,
    skip: number,
    limit: number,
    sortBy = 'paymentDate',
    sortOrder: 'asc' | 'desc' = 'desc',
  ): Promise<{ items: PaymentDocument[]; total: number }> {
    const sort: any = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    const [items, total] = await Promise.all([
      this.paymentModel
        .find(filter)
        .populate('customerId', 'name company customerCode')
        .populate('supplierId', 'name company supplierCode')
        .populate('createdBy', 'name')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.paymentModel.countDocuments(filter).exec(),
    ]);

    return { items, total };
  }

  async findById(id: string): Promise<PaymentDocument | null> {
    return this.paymentModel
      .findById(id)
      .populate('customerId')
      .populate('supplierId')
      .populate('createdBy', 'name email')
      .exec();
  }

  async count(): Promise<number> {
    return this.paymentModel.countDocuments().exec();
  }
}
