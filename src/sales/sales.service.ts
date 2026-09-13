import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  Optional,
} from '@nestjs/common';
import { SalesRepository } from './sales.repository';
import { CustomersService } from '../customers/customers.service';
import { ProductsService } from '../products/products.service';
import { InventoryService } from '../inventory/inventory.service';
import { PaymentsService } from '../payments/payments.service';
import { TransactionsService } from '../transactions/transactions.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { PaymentMethod, PaymentStatus, PaymentType } from '../common/enums/payment.enum';
import { InventoryTransactionType } from '../common/enums/inventory-transaction-type.enum';
import { CentralTransactionType } from '../common/enums/transaction-type.enum';
import { OrderStatus } from '../common/enums/order-status.enum';

@Injectable()
export class SalesService {
  constructor(
    private readonly salesRepository: SalesRepository,
    private readonly customersService: CustomersService,
    private readonly productsService: ProductsService,
    private readonly inventoryService: InventoryService,
    private readonly paymentsService: PaymentsService,
    private readonly transactionsService: TransactionsService,
    @Optional() private readonly auditLogsService?: AuditLogsService,
  ) {}

  async create(dto: CreateSaleDto, userId?: string) {
    const customer = await this.customersService.findById(dto.customerId);

    // Generate Invoice Number if not provided
    let invoiceNumber = dto.invoiceNumber;
    if (!invoiceNumber) {
      const count = await this.salesRepository.count();
      const year = new Date().getFullYear();
      invoiceNumber = `INV-${year}-${String(count + 1).padStart(5, '0')}`;
    }

    const existing = await this.salesRepository.findByInvoiceNumber(invoiceNumber);
    if (existing) {
      throw new ConflictException(`Invoice number '${invoiceNumber}' already exists`);
    }

    // Step 1: Validate all items & stock before mutating
    const processedItems: any[] = [];
    let subtotal = 0;
    let costOfGoodsSold = 0;

    for (const itemDto of dto.items) {
      const product = await this.productsService.findById(itemDto.productId);

      if (product.currentStock < itemDto.quantity) {
        throw new BadRequestException(
          `Insufficient stock for '${product.name}' (SKU: ${product.sku}). Available: ${product.currentStock}, Requested: ${itemDto.quantity}`,
        );
      }

      const itemSubtotal = itemDto.quantity * itemDto.sellingPrice;
      const itemDiscount = itemDto.discount || 0;
      const itemTax = (itemSubtotal - itemDiscount) * ((itemDto.taxPercentage || 0) / 100);
      const itemTotal = itemSubtotal - itemDiscount + itemTax;
      const itemCogs = itemDto.quantity * product.purchasePrice;

      subtotal += itemSubtotal;
      costOfGoodsSold += itemCogs;

      processedItems.push({
        productId: product._id,
        productNameSnapshot: product.name,
        skuSnapshot: product.sku,
        unitSnapshot: product.unit || 'cft',
        quantity: itemDto.quantity,
        purchasePriceSnapshot: product.purchasePrice,
        sellingPrice: itemDto.sellingPrice,
        discount: itemDiscount,
        tax: itemTax,
        subtotal: itemSubtotal,
        total: itemTotal,
      });
    }

    const overallDiscount = dto.discount || 0;
    const totalTax = processedItems.reduce((acc, it) => acc + it.tax, 0);
    const total = subtotal - overallDiscount + totalTax;

    const paidAmount = dto.paidAmount || 0;
    const dueAmount = Math.max(0, total - paidAmount);

    let paymentStatus = PaymentStatus.DUE;
    if (paidAmount >= total) {
      paymentStatus = PaymentStatus.PAID;
    } else if (paidAmount > 0) {
      paymentStatus = PaymentStatus.PARTIAL;
    }

    const saleDate = dto.saleDate ? new Date(dto.saleDate) : new Date();

    // Step 2: Atomic stock decrements and inventory transactions
    for (const item of processedItems) {
      const updatedProduct = await this.productsService.atomicUpdateStock(
        item.productId.toString(),
        -item.quantity,
      );

      await this.inventoryService.recordTransaction({
        productId: item.productId.toString(),
        type: InventoryTransactionType.SALE,
        quantity: -item.quantity,
        previousStock: updatedProduct.currentStock + item.quantity,
        newStock: updatedProduct.currentStock,
        referenceType: 'SALE',
        referenceId: invoiceNumber,
        reason: `Sold on invoice ${invoiceNumber}`,
        createdBy: userId,
      });
    }

    // Step 3: Create Sale Document (Gross Profit = Net Sales Revenue minus COGS, excluding tax liabilities)
    const netRevenue = subtotal - overallDiscount;
    const grossProfit = netRevenue - costOfGoodsSold;

    const sale = await this.salesRepository.create({
      invoiceNumber,
      customerId: dto.customerId,
      items: processedItems,
      subtotal,
      discount: overallDiscount,
      tax: totalTax,
      total,
      costOfGoodsSold,
      grossProfit,
      paidAmount,
      dueAmount,
      paymentStatus,
      paymentMethod: dto.paymentMethod || PaymentMethod.CASH,
      status: OrderStatus.CONFIRMED,
      saleDate,
      notes: dto.notes || '',
      createdBy: userId,
    });

    // Step 4: Update customer ledger with sale invoice total (payment ledger updated via paymentsService)
    await this.customersService.updateFinancials(dto.customerId, total, 0);

    // Step 5: Record central transaction
    await this.transactionsService.recordTransaction({
      type: CentralTransactionType.SALE,
      referenceType: 'SALE',
      referenceId: invoiceNumber,
      amount: total,
      customerId: dto.customerId,
      paymentStatus,
      description: `Sale invoice ${invoiceNumber} created for ${customer.name}`,
      createdBy: userId,
    });

    // Step 6: If paidAmount > 0, record payment entry
    if (paidAmount > 0) {
      await this.paymentsService.create(
        {
          type: PaymentType.RECEIVED,
          referenceType: 'SALE',
          referenceId: invoiceNumber,
          customerId: dto.customerId,
          amount: paidAmount,
          paymentMethod: dto.paymentMethod || PaymentMethod.CASH,
          paymentDate: saleDate.toISOString(),
          notes: `Payment for invoice ${invoiceNumber}`,
        },
        userId,
      );
    }

    // Step 7: Audit log
    if (this.auditLogsService) {
      await this.auditLogsService.log({
        userId,
        action: 'CREATE',
        module: 'SALES',
        entityType: 'Sale',
        entityId: sale._id.toString(),
        newData: sale,
        metadata: { invoiceNumber },
      });
    }

    return this.salesRepository.findById(sale._id.toString());
  }

  async findPaginated(
    query: PaginationQueryDto,
    customerId?: string,
    status?: string,
    paymentStatus?: string,
  ) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (customerId) {
      filter.customerId = customerId;
    }
    if (status) {
      filter.status = status;
    }
    if (paymentStatus) {
      filter.paymentStatus = paymentStatus;
    }
    if (query.search) {
      filter.invoiceNumber = { $regex: query.search, $options: 'i' };
    }
    if (query.from || query.to) {
      filter.saleDate = {};
      if (query.from) {
        filter.saleDate.$gte = new Date(query.from);
      }
      if (query.to) {
        filter.saleDate.$lte = new Date(query.to);
      }
    }

    const { items, total } = await this.salesRepository.findPaginated(
      filter,
      skip,
      limit,
      query.sortBy || 'saleDate',
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
    const sale = await this.salesRepository.findById(id);
    if (!sale) {
      throw new NotFoundException(`Sale with ID ${id} not found`);
    }
    return sale;
  }

  async cancelSale(id: string, userId?: string) {
    const sale = await this.findById(id);
    if (sale.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('Sale is already cancelled');
    }

    // Step 1: Restore stock atomically and log SALE_RETURN
    for (const item of sale.items) {
      const updated = await this.productsService.atomicUpdateStock(
        item.productId.toString(),
        item.quantity,
      );

      await this.inventoryService.recordTransaction({
        productId: item.productId.toString(),
        type: InventoryTransactionType.SALE_RETURN,
        quantity: item.quantity,
        previousStock: updated.currentStock - item.quantity,
        newStock: updated.currentStock,
        referenceType: 'SALE_RETURN',
        referenceId: sale.invoiceNumber,
        reason: `Restored due to cancellation of sale ${sale.invoiceNumber}`,
        createdBy: userId,
      });
    }

    // Step 2: Reverse customer ledger
    const customerId = (sale.customerId as any)._id
      ? (sale.customerId as any)._id.toString()
      : sale.customerId.toString();
    await this.customersService.updateFinancials(customerId, -sale.total, -sale.paidAmount);

    // Step 3: Record central transaction
    await this.transactionsService.recordTransaction({
      type: CentralTransactionType.SALE_RETURN,
      referenceType: 'SALE_CANCEL',
      referenceId: sale.invoiceNumber,
      amount: sale.total,
      customerId,
      description: `Sale ${sale.invoiceNumber} cancelled and stock returned`,
      createdBy: userId,
    });

    // Step 4: Mark sale cancelled
    return this.salesRepository.update(id, {
      status: OrderStatus.CANCELLED,
      updatedBy: userId,
    });
  }

  async getRecentSales(limit = 5) {
    return this.salesRepository.getRecentSales(limit);
  }
}
