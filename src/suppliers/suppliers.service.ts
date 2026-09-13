import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { SuppliersRepository } from './suppliers.repository';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { SupplierDocument } from './schemas/supplier.schema';

@Injectable()
export class SuppliersService {
  constructor(private readonly suppliersRepository: SuppliersRepository) {}

  async findPaginated(query: PaginationQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { supplierCode: { $regex: query.search, $options: 'i' } },
        { phone: { $regex: query.search, $options: 'i' } },
        { email: { $regex: query.search, $options: 'i' } },
        { company: { $regex: query.search, $options: 'i' } },
      ];
    }

    const { items, total } = await this.suppliersRepository.findPaginated(
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

  async findAll(): Promise<SupplierDocument[]> {
    return this.suppliersRepository.findAll({ status: 'ACTIVE' });
  }

  async findById(id: string): Promise<SupplierDocument> {
    const supplier = await this.suppliersRepository.findById(id);
    if (!supplier) {
      throw new NotFoundException(`Supplier with ID ${id} not found`);
    }
    return supplier;
  }

  async create(dto: CreateSupplierDto): Promise<SupplierDocument> {
    let supplierCode = dto.supplierCode;
    if (!supplierCode) {
      const count = await this.suppliersRepository.count();
      supplierCode = `SUP-${String(count + 1).padStart(4, '0')}`;
    }

    const existing = await this.suppliersRepository.findByCode(supplierCode);
    if (existing) {
      throw new ConflictException(`Supplier code '${supplierCode}' already exists`);
    }

    return this.suppliersRepository.create({
      ...dto,
      supplierCode: supplierCode.toUpperCase(),
      totalPurchases: 0,
      totalPaid: 0,
      totalDue: 0,
    });
  }

  async update(id: string, dto: UpdateSupplierDto): Promise<SupplierDocument> {
    const supplier = await this.findById(id);

    if (dto.supplierCode && dto.supplierCode.toUpperCase() !== supplier.supplierCode) {
      const existing = await this.suppliersRepository.findByCode(dto.supplierCode);
      if (existing) {
        throw new ConflictException(`Supplier code '${dto.supplierCode}' already exists`);
      }
    }

    return this.suppliersRepository.update(id, {
      ...dto,
      supplierCode: dto.supplierCode ? dto.supplierCode.toUpperCase() : supplier.supplierCode,
    });
  }

  async delete(id: string): Promise<void> {
    await this.findById(id);
    await this.suppliersRepository.delete(id);
  }

  async updateFinancials(id: string, purchaseDelta: number, paidDelta: number) {
    return this.suppliersRepository.updateFinancials(id, purchaseDelta, paidDelta);
  }
}
