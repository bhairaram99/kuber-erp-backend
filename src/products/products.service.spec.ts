import { ConflictException, NotFoundException } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsRepository } from './products.repository';
import { CategoriesService } from '../categories/categories.service';

describe('ProductsService', () => {
  let service: ProductsService;
  let repo: jest.Mocked<Partial<ProductsRepository>>;
  let catService: jest.Mocked<Partial<CategoriesService>>;

  beforeEach(() => {
    repo = {
      findBySku: jest.fn(),
      findByBarcode: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
      atomicUpdateStock: jest.fn(),
      atomicSetStock: jest.fn(),
    };
    catService = {
      findById: jest.fn().mockResolvedValue({ _id: 'cat1', name: 'Teak' } as any),
    };
    service = new ProductsService(repo as any, catService as any);
  });

  it('should throw ConflictException when creating product with duplicate SKU', async () => {
    repo.findBySku.mockResolvedValue({ _id: 'p1', sku: 'TEAK-01' } as any);

    await expect(
      service.create({
        name: 'Teak Log',
        sku: 'TEAK-01',
        categoryId: 'cat1',
        purchasePrice: 400,
        sellingPrice: 600,
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('should successfully create product with opening stock equal to current stock', async () => {
    repo.findBySku.mockResolvedValue(null);
    repo.create.mockImplementation(async (data) => ({ _id: 'newId', ...data } as any));

    const result = await service.create({
      name: 'Pine Plank',
      sku: 'PINE-01',
      categoryId: 'cat1',
      purchasePrice: 200,
      sellingPrice: 350,
      openingStock: 50,
    });

    expect(result.currentStock).toBe(50);
    expect(repo.create).toHaveBeenCalled();
  });
});
