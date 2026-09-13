import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  Optional,
} from '@nestjs/common';
import { PurchasesRepository } from './purchases.repository';
import { SuppliersService } from '../suppliers/suppliers.service';
import { ProductsService } from '../products/products.service';
import { InventoryService } from '../inventory/inventory.service';
import { PaymentsService } from '../payments/payments.service';
import { TransactionsService } from '../transactions/transactions.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { PaymentMethod, PaymentStatus, PaymentType } from '../common/enums/payment.enum';
import { InventoryTransactionType } from '../common/enums/inventory-transaction-type.enum';
import { CentralTransactionType } from '../common/enums/transaction-type.enum';
import { OrderStatus } from '../common/enums/order-status.enum';

@Injectable()
export class PurchasesService {
  constructor(
    private readonly purchasesRepository: PurchasesRepository,
    private readonly suppliersService: SuppliersService,
    private readonly productsService: ProductsService,
    private readonly inventoryService: InventoryService,
    private readonly paymentsService: PaymentsService,
    private readonly transactionsService: TransactionsService,
    @Optional() private readonly auditLogsService?: AuditLogsService,
  ) {}

  async create(dto: CreatePurchaseDto, userId?: string) {
    const supplier = await this.suppliersService.findById(dto.supplierId);

    // Generate Purchase Number if not provided
    let purchaseNumber = dto.purchaseNumber;
    if (!purchaseNumber) {
      const count = await this.purchasesRepository.count();
      const year = new Date().getFullYear();
      purchaseNumber = `PO-${year}-${String(count + 1).padStart(5, '0')}`;
    }

    const existing = await this.purchasesRepository.findByPurchaseNumber(purchaseNumber);
    if (existing) {
      throw new ConflictException(`Purchase number '${purchaseNumber}' already exists`);
    }

    // Step 1: Validate products and build snapshots
    const processedItems: any[] = [];
    let subtotal = 0;

    for (const itemDto of dto.items) {
      const product = await this.productsService.findById(itemDto.productId);

      const itemSubtotal = itemDto.quantity * itemDto.purchasePrice;
      const itemDiscount = itemDto.discount || 0;
      const itemTax = (itemSubtotal - itemDiscount) * ((itemDto.taxPercentage || 0) / 100);
      const itemTotal = itemSubtotal - itemDiscount + itemTax;

      subtotal += itemSubtotal;

      processedItems.push({
        productId: product._id,
        productNameSnapshot: product.name,
        skuSnapshot: product.sku,
        unitSnapshot: product.unit || 'cft',
        quantity: itemDto.quantity,
        purchasePrice: itemDto.purchasePrice,
        tax: itemTax,
        discount: itemDiscount,
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

    const purchaseDate = dto.purchaseDate ? new Date(dto.purchaseDate) : new Date();

    // Step 2: Atomic stock increment & inventory movement
    for (const item of processedItems) {
      const updatedProduct = await this.productsService.atomicUpdateStock(
        item.productId.toString(),
        item.quantity,
      );

      await this.inventoryService.recordTransaction({
        productId: item.productId.toString(),
        type: InventoryTransactionType.PURCHASE,
        quantity: item.quantity,
        previousStock: updatedProduct.currentStock - item.quantity,
        newStock: updatedProduct.currentStock,
        referenceType: 'PURCHASE',
        referenceId: purchaseNumber,
        reason: `Received on purchase order ${purchaseNumber}`,
        createdBy: userId,
      });
    }

    // Step 3: Create Purchase record
    const purchase = await this.purchasesRepository.create({
      purchaseNumber,
      supplierId: dto.supplierId,
      items: processedItems,
      subtotal,
      discount: overallDiscount,
      tax: totalTax,
      total,
      paidAmount,
      dueAmount,
      paymentStatus,
      paymentMethod: dto.paymentMethod || PaymentMethod.BANK_TRANSFER,
      status: OrderStatus.CONFIRMED,
      purchaseDate,
      notes: dto.notes || '',
      createdBy: userId,
    });

    // Step 4: Update supplier financials with purchase order total (payment ledger updated via paymentsService)
    await this.suppliersService.updateFinancials(dto.supplierId, total, 0);

    // Step 5: Record central transaction
    await this.transactionsService.recordTransaction({
      type: CentralTransactionType.PURCHASE,
      referenceType: 'PURCHASE',
      referenceId: purchaseNumber,
      amount: total,
      supplierId: dto.supplierId,
      paymentStatus,
      description: `Purchase order ${purchaseNumber} received from ${supplier.name}`,
      createdBy: userId,
    });

    // Step 6: If paidAmount > 0, record payment sent
    if (paidAmount > 0) {
      await this.paymentsService.create(
        {
          type: PaymentType.SENT,
          referenceType: 'PURCHASE',
          referenceId: purchaseNumber,
          supplierId: dto.supplierId,
          amount: paidAmount,
          paymentMethod: dto.paymentMethod || PaymentMethod.BANK_TRANSFER,
          paymentDate: purchaseDate.toISOString(),
          notes: `Payment for purchase order ${purchaseNumber}`,
        },
        userId,
      );
    }

    // Step 7: Audit log
    if (this.auditLogsService) {
      await this.auditLogsService.log({
        userId,
        action: 'CREATE',
        module: 'PURCHASES',
        entityType: 'Purchase',
        entityId: purchase._id.toString(),
        newData: purchase,
        metadata: { purchaseNumber },
      });
    }

    return this.purchasesRepository.findById(purchase._id.toString());
  }

  async findPaginated(
    query: PaginationQueryDto,
    supplierId?: string,
    status?: string,
    paymentStatus?: string,
  ) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (supplierId) {
      filter.supplierId = supplierId;
    }
    if (status) {
      filter.status = status;
    }
    if (paymentStatus) {
      filter.paymentStatus = paymentStatus;
    }
    if (query.search) {
      filter.purchaseNumber = { $regex: query.search, $options: 'i' };
    }
    if (query.from || query.to) {
      filter.purchaseDate = {};
      if (query.from) {
        filter.purchaseDate.$gte = new Date(query.from);
      }
      if (query.to) {
        filter.purchaseDate.$lte = new Date(query.to);
      }
    }

    const { items, total } = await this.purchasesRepository.findPaginated(
      filter,
      skip,
      limit,
      query.sortBy || 'purchaseDate',
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
    const purchase = await this.purchasesRepository.findById(id);
    if (!purchase) {
      throw new NotFoundException(`Purchase with ID ${id} not found`);
    }
    return purchase;
  }

  async getRecentPurchases(limit = 5) {
    return this.purchasesRepository.getRecentPurchases(limit);
  }
}
