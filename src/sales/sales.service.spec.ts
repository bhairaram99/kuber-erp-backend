import { BadRequestException } from '@nestjs/common';
import { SalesService } from './sales.service';
import { SalesRepository } from './sales.repository';
import { CustomersService } from '../customers/customers.service';
import { ProductsService } from '../products/products.service';
import { InventoryService } from '../inventory/inventory.service';
import { PaymentsService } from '../payments/payments.service';
import { TransactionsService } from '../transactions/transactions.service';

describe('SalesService', () => {
  let service: SalesService;
  let salesRepo: jest.Mocked<Partial<SalesRepository>>;
  let customersService: jest.Mocked<Partial<CustomersService>>;
  let productsService: jest.Mocked<Partial<ProductsService>>;
  let inventoryService: jest.Mocked<Partial<InventoryService>>;
  let paymentsService: jest.Mocked<Partial<PaymentsService>>;
  let transactionsService: jest.Mocked<Partial<TransactionsService>>;

  beforeEach(() => {
    salesRepo = {
      count: jest.fn().mockResolvedValue(0),
      findByInvoiceNumber: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation((d) => Promise.resolve({ _id: 'sale1', ...d })),
      findById: jest.fn().mockImplementation((id) => Promise.resolve({ _id: id, invoiceNumber: 'INV-1' } as any)),
      update: jest.fn(),
    };
    customersService = {
      findById: jest.fn().mockResolvedValue({ _id: 'c1', name: 'Patel Woodcraft' } as any),
      updateFinancials: jest.fn().mockResolvedValue({} as any),
    };
    productsService = {
      findById: jest.fn().mockResolvedValue({
        _id: 'p1',
        name: 'Teak Timber',
        sku: 'TEAK-01',
        unit: 'cft',
        currentStock: 100,
        purchasePrice: 400,
        sellingPrice: 600,
      } as any),
      atomicUpdateStock: jest.fn().mockResolvedValue({ _id: 'p1', currentStock: 90 } as any),
    };
    inventoryService = {
      recordTransaction: jest.fn().mockResolvedValue({} as any),
    };
    paymentsService = {
      create: jest.fn().mockResolvedValue({} as any),
    };
    transactionsService = {
      recordTransaction: jest.fn().mockResolvedValue({} as any),
    };

    service = new SalesService(
      salesRepo as any,
      customersService as any,
      productsService as any,
      inventoryService as any,
      paymentsService as any,
      transactionsService as any,
    );
  });

  it('should throw BadRequestException if customer requests more stock than available', async () => {
    productsService.findById.mockResolvedValueOnce({
      _id: 'p1',
      name: 'Teak Timber',
      currentStock: 5,
    } as any);

    await expect(
      service.create({
        customerId: 'c1',
        items: [{ productId: 'p1', quantity: 10, sellingPrice: 600 }],
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should calculate revenue, COGS and gross profit correctly for confirmed sale', async () => {
    // 10 units @ ₹600 selling price, purchase price is ₹400
    // Revenue = ₹6,000
    // COGS = 10 * ₹400 = ₹4,000
    // Gross Profit = ₹2,000
    await service.create({
      customerId: 'c1',
      items: [{ productId: 'p1', quantity: 10, sellingPrice: 600 }],
      paidAmount: 5000,
    });

    expect(salesRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        total: 6000,
        costOfGoodsSold: 4000,
        grossProfit: 2000,
        paidAmount: 5000,
        dueAmount: 1000,
      }),
    );
    expect(productsService.atomicUpdateStock).toHaveBeenCalledWith('p1', -10);
    expect(customersService.updateFinancials).toHaveBeenCalledWith('c1', 6000, 0);
  });
});
