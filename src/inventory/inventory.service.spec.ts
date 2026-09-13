import { BadRequestException } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { InventoryRepository } from './inventory.repository';
import { ProductsService } from '../products/products.service';
import { InventoryTransactionType } from '../common/enums/inventory-transaction-type.enum';

describe('InventoryService', () => {
  let service: InventoryService;
  let inventoryRepo: jest.Mocked<Partial<InventoryRepository>>;
  let productsService: jest.Mocked<Partial<ProductsService>>;

  beforeEach(() => {
    inventoryRepo = {
      create: jest.fn().mockImplementation((d) => Promise.resolve({ _id: 'tx1', ...d })),
    };
    productsService = {
      findById: jest.fn(),
      atomicUpdateStock: jest.fn(),
      atomicSetStock: jest.fn(),
    };
    service = new InventoryService(inventoryRepo as any, productsService as any);
  });

  it('should prevent adjusting stock out when quantity exceeds available stock', async () => {
    productsService.findById.mockResolvedValue({
      _id: 'p1',
      name: 'Teak',
      currentStock: 10,
    } as any);

    await expect(
      service.adjustStock(
        {
          productId: 'p1',
          type: InventoryTransactionType.DAMAGE,
          quantity: 20, // 20 > 10
          reason: 'Termite damage',
        },
        'user1',
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('should adjust stock and create inventory transaction for DAMAGE', async () => {
    productsService.findById.mockResolvedValue({
      _id: 'p1',
      name: 'Teak',
      currentStock: 50,
    } as any);

    productsService.atomicUpdateStock.mockResolvedValue({
      _id: 'p1',
      currentStock: 45,
    } as any);

    const res = await service.adjustStock(
      {
        productId: 'p1',
        type: InventoryTransactionType.DAMAGE,
        quantity: 5,
        reason: 'Water rot damage',
      },
      'user1',
    );

    expect(productsService.atomicUpdateStock).toHaveBeenCalledWith('p1', -5);
    expect(inventoryRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        type: InventoryTransactionType.DAMAGE,
        quantity: -5,
        previousStock: 50,
        newStock: 45,
      }),
    );
  });
});
