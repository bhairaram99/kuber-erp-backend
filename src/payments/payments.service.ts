import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PaymentsRepository } from './payments.repository';
import { CustomersService } from '../customers/customers.service';
import { SuppliersService } from '../suppliers/suppliers.service';
import { TransactionsService } from '../transactions/transactions.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { PaymentType } from '../common/enums/payment.enum';
import { CentralTransactionType } from '../common/enums/transaction-type.enum';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly paymentsRepository: PaymentsRepository,
    private readonly customersService: CustomersService,
    private readonly suppliersService: SuppliersService,
    private readonly transactionsService: TransactionsService,
  ) {}

  async create(dto: CreatePaymentDto, userId?: string) {
    const count = await this.paymentsRepository.count();
    const paymentNumber = `PAY-${String(count + 1).padStart(6, '0')}`;

    const paymentDate = dto.paymentDate ? new Date(dto.paymentDate) : new Date();

    const payment = await this.paymentsRepository.create({
      paymentNumber,
      type: dto.type,
      referenceType: dto.referenceType || 'DIRECT',
      referenceId: dto.referenceId || '',
      customerId: dto.customerId || null,
      supplierId: dto.supplierId || null,
      amount: dto.amount,
      paymentMethod: dto.paymentMethod,
      paymentDate,
      notes: dto.notes || '',
      createdBy: userId,
    });

    if (dto.type === PaymentType.RECEIVED && dto.customerId) {
      // Update customer ledger
      await this.customersService.updateFinancials(dto.customerId, 0, dto.amount);

      await this.transactionsService.recordTransaction({
        type: CentralTransactionType.PAYMENT_RECEIVED,
        referenceType: 'PAYMENT',
        referenceId: payment.paymentNumber,
        amount: dto.amount,
        customerId: dto.customerId,
        description: `Payment received via ${dto.paymentMethod}. ${dto.notes || ''}`,
        createdBy: userId,
      });
    } else if (dto.type === PaymentType.SENT && dto.supplierId) {
      // Update supplier ledger
      await this.suppliersService.updateFinancials(dto.supplierId, 0, dto.amount);

      await this.transactionsService.recordTransaction({
        type: CentralTransactionType.PAYMENT_SENT,
        referenceType: 'PAYMENT',
        referenceId: payment.paymentNumber,
        amount: dto.amount,
        supplierId: dto.supplierId,
        description: `Payment sent via ${dto.paymentMethod}. ${dto.notes || ''}`,
        createdBy: userId,
      });
    }

    return payment;
  }

  async update(id: string, dto: CreatePaymentDto) {
    const existing = await this.paymentsRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('Payment not found');
    }

    const previousCustomerId = partyId(existing.customerId);
    const previousSupplierId = partyId(existing.supplierId);
    if (existing.type === PaymentType.RECEIVED && previousCustomerId) {
      await this.customersService.updateFinancials(previousCustomerId, 0, -existing.amount);
    } else if (existing.type === PaymentType.SENT && previousSupplierId) {
      await this.suppliersService.updateFinancials(previousSupplierId, 0, -existing.amount);
    }

    const paymentDate = dto.paymentDate ? new Date(dto.paymentDate) : existing.paymentDate;
    const customerId = dto.type === PaymentType.RECEIVED ? dto.customerId || null : null;
    const supplierId = dto.type === PaymentType.SENT ? dto.supplierId || null : null;

    await this.paymentsRepository.update(id, {
      type: dto.type,
      customerId,
      supplierId,
      amount: dto.amount,
      paymentMethod: dto.paymentMethod,
      paymentDate,
      notes: dto.notes || '',
    });

    if (dto.type === PaymentType.RECEIVED && customerId) {
      await this.customersService.updateFinancials(customerId, 0, dto.amount);
    } else if (dto.type === PaymentType.SENT && supplierId) {
      await this.suppliersService.updateFinancials(supplierId, 0, dto.amount);
    }

    await this.transactionsService.updateByReference('PAYMENT', existing.paymentNumber, {
      type:
        dto.type === PaymentType.RECEIVED
          ? CentralTransactionType.PAYMENT_RECEIVED
          : CentralTransactionType.PAYMENT_SENT,
      amount: dto.amount,
      customerId,
      supplierId,
      description: `Payment updated via ${dto.paymentMethod}. ${dto.notes || ''}`,
    });

    return this.paymentsRepository.findById(id);
  }

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
    if (query.from || query.to) {
      filter.paymentDate = {};
      if (query.from) {
        filter.paymentDate.$gte = new Date(query.from);
      }
      if (query.to) {
        filter.paymentDate.$lte = new Date(query.to);
      }
    }

    const { items, total } = await this.paymentsRepository.findPaginated(
      filter,
      skip,
      limit,
      query.sortBy || 'paymentDate',
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
    return this.paymentsRepository.findById(id);
  }
}

function partyId(value: unknown): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  const record = value as { _id?: { toString(): string } | string };
  if (!record._id) return '';
  return typeof record._id === 'string' ? record._id : record._id.toString();
}
