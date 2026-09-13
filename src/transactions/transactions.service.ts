import { Injectable, NotFoundException } from '@nestjs/common';
import { TransactionsRepository } from './transactions.repository';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { CentralTransactionType } from '../common/enums/transaction-type.enum';
import { PaymentStatus } from '../common/enums/payment.enum';

@Injectable()
export class TransactionsService {
  constructor(private readonly transactionsRepository: TransactionsRepository) {}

  async findPaginated(
    query: PaginationQueryDto,
    type?: string,
    customerId?: string,
    supplierId?: string,
  ) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (type) {
      filter.type = type;
    }
    if (customerId) {
      filter.customerId = customerId;
    }
    if (supplierId) {
      filter.supplierId = supplierId;
    }
    if (query.search) {
      filter.$or = [
        { transactionNumber: { $regex: query.search, $options: 'i' } },
        { description: { $regex: query.search, $options: 'i' } },
      ];
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

    const { items, total } = await this.transactionsRepository.findPaginated(
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

  async findById(id: string) {
    const transaction = await this.transactionsRepository.findById(id);
    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }
    return transaction;
  }

  async recordTransaction(data: {
    type: CentralTransactionType;
    referenceType: string;
    referenceId: string;
    amount: number;
    customerId?: string;
    supplierId?: string;
    paymentStatus?: PaymentStatus;
    status?: string;
    description?: string;
    createdBy?: string;
  }) {
    const count = await this.transactionsRepository.count();
    const transactionNumber = `TXN-${String(count + 1).padStart(6, '0')}`;

    return this.transactionsRepository.create({
      transactionNumber,
      type: data.type,
      referenceType: data.referenceType,
      referenceId: data.referenceId,
      amount: data.amount,
      customerId: data.customerId || null,
      supplierId: data.supplierId || null,
      paymentStatus: data.paymentStatus || PaymentStatus.PAID,
      status: data.status || 'COMPLETED',
      description: data.description || '',
      createdBy: data.createdBy,
    });
  }

  async getRecent(limit = 8) {
    return this.transactionsRepository.getRecent(limit);
  }
}
